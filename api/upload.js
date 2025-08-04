import { put, get } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "200mb", // allow large files
    },
  },
};

const EMAILS_FILE = "emails.txt";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", *);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { artistName, songTitle, email, fileName, fileData } = req.body;

    if (!artistName || !songTitle || !email || !fileName || !fileData) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Sanitize inputs (basic: remove special chars, trim)
    const safeArtist = artistName.trim().replace(/[\/\\:*?"<>|]/g, "");
    const safeTitle = songTitle.trim().replace(/[\/\\:*?"<>|]/g, "");
    const safeEmail = email.trim().toLowerCase();

    // Get original extension
    const extMatch = fileName.match(/\.[^\.]+$/);
    const extension = extMatch ? extMatch[0] : "";

    // Construct new filename
    const newFileName = `${safeArtist} - ${safeTitle}${extension}`;

    // Decode base64 to buffer
    const buffer = Buffer.from(fileData, "base64");

    // Upload renamed file to Vercel Blob Storage
    const blob = await put(newFileName, buffer, {
      access: "public",
    });

    // --- Handle emails.txt storage ---
    let existingEmails = "";

    try {
      const emailsBlob = await get(EMAILS_FILE);
      existingEmails = new TextDecoder().decode(await emailsBlob.arrayBuffer());
    } catch {
      // file might not exist yet — ignore error
    }

    const emailsList = existingEmails
      .split("\n")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!emailsList.includes(safeEmail)) {
      emailsList.push(safeEmail);
      const updatedEmails = emailsList.join("\n");
      const emailsBuffer = Buffer.from(updatedEmails, "utf-8");

      await put(EMAILS_FILE, emailsBuffer, { access: "private" });
      // You may want private so no one can download emails.txt publicly
    }

    // Response with uploaded file URL
    res.status(200).json({
      success: true,
      message: "File uploaded and email recorded!",
      fileUrl: blob.url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
}
