import fetch from "node-fetch";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

function bufferRequest(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const DROPBOX_PERMANENT_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;
  if (!DROPBOX_PERMANENT_TOKEN) {
    return res.status(500).json({ error: "Dropbox token not set." });
  }

  const isChunked = req.headers["x-dropbox-session-id"];

  if (isChunked) {
    // Handle chunked upload
    const sessionId = req.headers["x-dropbox-session-id"];
    const offset = parseInt(req.headers["x-dropbox-offset"], 10);

    if (!sessionId || isNaN(offset)) {
      return res.status(400).json({
        error: "Missing or invalid x-dropbox-session-id or x-dropbox-offset",
      });
    }

    const binaryData = await bufferRequest(req);

    const response = await fetch("https://content.dropboxapi.com/2/files/upload_session/append_v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DROPBOX_PERMANENT_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({
          cursor: {
            session_id: sessionId,
            offset: offset,
          },
          close: false,
        }),
        "Content-Type": "application/octet-stream",
      },
      body: binaryData,
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    return res.status(200).json({ success: true });
  } else {
    // Direct upload
    const form = new formidable.IncomingForm({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(500).json({ error: "Failed to parse form." });
      }

      const file = files.file;
      const dropboxPath = fields.dropboxPath;

      if (!file || !dropboxPath) {
        return res.status(400).json({ error: "Missing file or dropboxPath" });
      }

      const fs = await import("fs/promises");
      const fileBuffer = await fs.readFile(file.filepath);

      const uploadRes = await fetch("https://content.dropboxapi.com/2/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DROPBOX_PERMANENT_TOKEN}`,
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify({
            path: dropboxPath,
            mode: "add",
            autorename: true,
            mute: false,
          }),
        },
        body: fileBuffer,
      });

      const json = await uploadRes.json();
      if (!uploadRes.ok) {
        console.error("Direct upload failed:", json);
        return res.status(500).json({ error: json.error_summary || "Upload failed." });
      }

      return res.status(200).json({ success: true });
    });
  }
}
