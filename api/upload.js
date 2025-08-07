import { storage } from "../lib/firebaseAdmin.js";
import { Readable } from "stream";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { filename, contentType } = req.headers;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

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
}
