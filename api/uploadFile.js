import formidable from "formidable";
import fs from "fs";
import { getAccessToken } from "../lib/dropbox.js";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "File upload failed." });
    }

    const { artist, email } = fields;
    const file = files.file;

    if (!artist || !email || !file) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const accessToken = await getAccessToken();
    const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB

    const dropboxPath = `/MusicUploads/${new Date().toISOString().split('T')[0]}/${artist} - ${file.originalFilename} (${email}).mp3`;

    const stream = fs.createReadStream(file.filepath, { highWaterMark: CHUNK_SIZE });

    // Step 1: Start upload session
    const startRes = await fetch("https://content.dropboxapi.com/2/files/upload_session/start", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({ close: false }),
        "Content-Type": "application/octet-stream"
      },
      body: null
    });
    const startData = await startRes.json();
    if (!startRes.ok || !startData.session_id) {
      return res.status(500).json({ error: "Failed to start Dropbox upload." });
    }

    const sessionId = startData.session_id;

    // Step 2: Append chunks
    let offset = 0;
    for await (const chunk of stream) {
      const appendRes = await fetch("https://content.dropboxapi.com/2/files/upload_session/append_v2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Dropbox-API-Arg": JSON.stringify({
            cursor: { session_id: sessionId, offset },
            close: false
          }),
          "Content-Type": "application/octet-stream"
        },
        body: chunk
      });
      if (!appendRes.ok) {
        const errText = await appendRes.text();
        console.error("Dropbox append error:", errText);
        return res.status(500).json({ error: "Dropbox append failed." });
      }
      offset += chunk.length;
    }

    // Step 3: Finish upload
    const finishRes = await fetch("https://content.dropboxapi.com/2/files/upload_session/finish", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({
          cursor: { session_id: sessionId, offset },
          commit: {
            path: dropboxPath,
            mode: "add",
            autorename: true,
            mute: false
          }
        }),
        "Content-Type": "application/octet-stream"
      },
      body: ""
    });

    const finishData = await finishRes.json();
    if (!finishRes.ok) {
      return res.status(500).json({ error: "Failed to finish Dropbox upload." });
    }

    return res.status(200).json({ success: true, file: finishData });
  });
}
