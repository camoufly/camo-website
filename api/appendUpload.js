import formidable from "formidable";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false, // Required to manually parse incoming stream
    externalResolver: true,
  },
};

// Buffer binary body manually (for chunked upload)
function bufferRequest(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
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
    return res.status(500).json({ error: "Dropbox token not configured." });
  }

  const isChunked = req.headers["x-dropbox-session-id"];

  try {
    if (isChunked) {
      // === 🔄 Handle chunked upload ===
      const sessionId = req.headers["x-dropbox-session-id"];
      const offset = parseInt(req.headers["x-dropbox-offset"], 10);

      if (!sessionId || isNaN(offset)) {
        return res.status(400).json({ error: "Missing headers: x-dropbox-session-id or x-dropbox-offset" });
      }

      const binaryData = await bufferRequest(req);

      const appendRes = await fetch("https://content.dropboxapi.com/2/files/upload_session/append_v2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DROPBOX_PERMANENT_TOKEN}`,
          "Dropbox-API-Arg": JSON.stringify({
            cursor: { session_id: sessionId, offset },
            close: false
          }),
          "Content-Type": "application/octet-stream"
        },
        body: binaryData
      });

      if (!appendRes.ok) {
        const text = await appendRes.text();
        if (appendRes.status === 413) {
          return res.status(413).json({ error: "Payload too large. Try a smaller chunk." });
        }
        throw new Error(text);
      }

      return res.status(200).json({ success: true });

    } else {
      // === 📦 Handle direct upload (FormData) ===
      const form = new formidable.IncomingForm({ maxFileSize: 100 * 1024 * 1024 }); // 100MB limit

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("❌ Formidable parse error:", err);
          return res.status(400).json({ error: "Failed to parse upload form data." });
        }

        const { dropboxPath } = fields;
        const file = files.file?.[0] || files.file;

        if (!dropboxPath || !file?.filepath) {
          return res.status(400).json({ error: "Missing file or dropboxPath" });
        }

        const fileBuffer = await fs.promises.readFile(file.filepath);

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
          const text = await uploadRes.text();
          throw new Error(text);
        }

        return res.status(200).json({ success: true });
      });
    }
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
