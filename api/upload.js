import { storage } from "../lib/firebaseAdmin.js";
import { Readable } from "stream";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  if (contentLength > 100 * 1024 * 1024) {
    return res.status(413).json({ error: "File too large. Max 100MB allowed." });
  }

  const { filename, contentType } = req.headers;

  if (!filename || typeof filename !== "string") {
    return res.status(400).json({ error: "Missing or invalid filename in headers." });
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  try {
    const bucket = storage.bucket();
    const file = bucket.file(filename);

    const stream = file.createWriteStream({
      metadata: {
        contentType: contentType || "application/octet-stream",
      },
    });

    stream.end(buffer);

    stream.on("finish", () => {
      res.status(200).json({ message: "✅ Uploaded successfully!" });
    });

    stream.on("error", (err) => {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Upload failed." });
    });
  } catch (err) {
    console.error("Upload processing failed:", err);
    res.status(500).json({ error: "Unexpected error occurred during upload." });
  }
}
