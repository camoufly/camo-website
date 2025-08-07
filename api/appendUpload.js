import { IncomingForm } from "formidable";
import fs from "fs/promises";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false,
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const DROPBOX_PERMANENT_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;
  if (!DROPBOX_PERMANENT_TOKEN) {
    return res.status(500).json({ error: "Dropbox token not configured." });
  }

  const sessionId = req.headers["x-dropbox-session-id"];
  const offsetHeader = req.headers["x-dropbox-offset"];

  // === 🔁 CHUNKED Upload (binary stream) ===
  if (sessionId && offsetHeader) {
    try {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      const appendRes = await fetch("https://content.dropboxapi.com/2/files/upload_session/append_v2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DROPBOX_PERMANENT_TOKEN}`,
          "Dropbox-API-Arg": JSON.stringify({
            cursor: {
              session_id: sessionId,
              offset: parseInt(offsetHeader, 10)
            },
            close: false
          }),
          "Content-Type": "application/octet-stream"
        },
        body: buffer
      });

      if (!appendRes.ok) {
        const errText = await appendRes.text();
        return res.status(appendRes.status).json({ error: `Append failed: ${errText}` });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Chunked upload error:", err);
      return res.status(500).json({ error: "Chunked upload error" });
    }
  }

  // === 📦 DIRECT Upload (via FormData + formidable) ===
  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable error:", err);
      return res.status(400).json({ error: "File parsing error" });
    }

    const { file } = files;
    const { dropboxPath } = fields;

    if (!file || !dropboxPath) {
      return res.status(400).json({ error: "Missing file or dropboxPath" });
    }

    try {
      const fileBuffer = await fs.readFile(file.filepath);

      const uploadRes = await fetch("https://content.dropboxapi.com/2/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DROPBOX_PERMANENT_TOKEN}`,
          "Dropbox-API-Arg": JSON.stringify({
            path: dropboxPath,
            mode: "add",
            autorename: true,
            mute: false
          }),
          "Content-Type": "application/octet-stream"
        },
        body: fileBuffer
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        return res.status(uploadRes.status).json({ error: errorText });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Direct upload error:", err);
      return res.status(500).json({ error: "Direct upload error" });
    }
  });
}
