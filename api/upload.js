// /api/upload.js
import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "200mb", // allow large files
    },
  },
};

export default async function handler(req, res) {
  // Enable CORS so you can call from https://camoufly.me
  res.setHeader("Access-Control-Allow-Origin", "https://camoufly.me");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: "Missing file or file data" });
    }

    // Decode base64 string to buffer
    const buffer = Buffer.from(fileData, "base64");

    // Upload to Vercel Blob Storage
    const blob = await put(fileName, buffer, {
      access: "public", // makes file accessible via public URL
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      fileUrl: blob.url, // public URL
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
}
