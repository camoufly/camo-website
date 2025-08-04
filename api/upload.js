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
  // Adjust CORS: Replace * with your domain to avoid errors
  const allowedOrigin = "https://camoufly.me"; // Change if needed
  const origin = req.headers.origin;
  if (origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "null"); // Block unknown origins
  }

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

    // Sanitize inputs
    const safeArtist = artistName.trim().replace(/[\/\\:*?"<>|]/g, "");
    const safeTitle = songTitle.trim().replace(/[\/\\:*?"<>|]/g, "");
    const safeEmail = email.trim().toLowerCase();

    // Get file extension (including the dot)
    const extMatch = fileName.match(/\.[^\.]+$/);
    const extension = extMatch ? extMatch[0] : "";

    // New filename format: Artist Name - Song Title.ext
    const newFileName = `${safeArtist} - ${safeTitle}${extension}`;

    // Decode base64 file data to Buffer
    const buffer = Buffer.from(fileData, "base64");

    console.log(`[upload.js] Uploading file as: ${newFileName}`);

    // Upload renamed file with public access
    const blob = await put(newFileName, buffer, {
      access: "public",
    });

    // --- Handle emails.txt storage ---
    let existingEmails = "";

    try {
      const emailsBlob = await get(EMAILS_FILE);
      existingEmails = new TextDecoder().decode(await emailsBlob.arrayBuffer());
      console.log("[upload.js] Loaded existing emails.txt");
    } catch (err) {
      console.log("[upload.js] emails.txt not found, creating new.");
    }

    // Normalize and split emails
    const emailsList = existingEmails
      .split("\n")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!emailsList.includes(safeEmail)) {
      emailsList.push(safeEmail);
      const updatedEmails = emailsList.join("\n");
      const emailsBuffer = Buffer.from(updatedEmails, "utf-8");

      // Save updated emails.txt privately so no public access
      await put(EMAILS_FILE, emailsBuffer, { access: "private" });
      console.log(`[upload.js] Added new email: ${safeEmail}`);
    } else {
      console.log(`[upload.js] Email already exists: ${safeEmail}`);
    }

    // Success response
    res.status(200).json({
      success: true,
      message: "File uploaded and email recorded!",
      fileUrl: blob.url,
    });
  } catch (error) {
    console.error("[upload.js] Upload error:", error);
    res.status(500).json({ error: error.message });
  }
}
