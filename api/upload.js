import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "200mb", // allow large files
    },
  },
};

export default async function handler(req, res) {
  console.log("🟢 Request received:", req.method, req.url);

  // CORS headers for debugging, allow all origins temporarily
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    console.log("⚙️ Handling OPTIONS preflight request");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.warn(`⚠️ Method not allowed: ${req.method}`);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      console.error("❌ Missing fileName or fileData in request body");
      return res.status(400).json({ error: "Missing file or file data" });
    }

    console.log(`📦 Preparing to upload file: ${fileName}`);

    // Decode base64 string to buffer
    const buffer = Buffer.from(fileData, "base64");
    console.log(`📏 File buffer size: ${buffer.length} bytes`);

    // Upload to Vercel Blob Storage
    const blob = await put(fileName, buffer, {
      access: "public", // public access to file URL
    });
    console.log("🚀 Upload successful:", blob.url);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      fileUrl: blob.url,
    });

  } catch (error) {
    console.error("🔥 Upload error caught:", error);
    res.status(500).json({ error: error.message });
  }
}
