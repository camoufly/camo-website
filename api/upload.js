export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "https://camoufly.me");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS method (CORS preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: "Missing file or file data" });
    }

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywKjF7aC1X-8YLuE8xCiw_waOIONsgPKOclI18EGSWMeeFHYzg_zJEL309xXItQjqP/exec";
    // Send file to Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, fileData }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload file");
    }

    res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      fileUrl: data.fileUrl || null
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
}
