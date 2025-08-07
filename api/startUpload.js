import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const DROPBOX_PERMANENT_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;

    // Debug: Check token existence (never log the actual token!)
    console.log("🔍 Dropbox token exists:", !!DROPBOX_PERMANENT_TOKEN);

    if (!DROPBOX_PERMANENT_TOKEN) {
      throw new Error("❌ Dropbox permanent token is not set in environment variables.");
    }

    // Start a new Dropbox upload session
    const startRes = await fetch("https://content.dropboxapi.com/2/files/upload_session/start", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DROPBOX_PERMANENT_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({ close: false }),
        "Content-Type": "application/octet-stream"
      },
      body: "" // No content yet, just opening a session
    });

    const data = await startRes.json();

    // Debug: Log raw Dropbox response if there's an error
    if (!startRes.ok) {
      console.error("❌ Dropbox upload_session/start failed:", JSON.stringify(data, null, 2));
      throw new Error(data.error_summary || "Failed to start upload session.");
    }

    console.log("✅ Dropbox session started:", data.session_id);

    res.status(200).json({ session_id: data.session_id });
  } catch (error) {
    console.error("🔥 startUpload.js error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
