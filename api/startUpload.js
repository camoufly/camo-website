import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const DROPBOX_PERMANENT_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;
    if (!DROPBOX_PERMANENT_TOKEN) {
      throw new Error("Dropbox permanent token not configured.");
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
    if (!startRes.ok) {
      throw new Error(data.error_summary || "Failed to start upload session");
    }

    res.status(200).json({ session_id: data.session_id });
  } catch (error) {
    console.error("startUpload error:", error);
    res.status(500).json({ error: error.message });
  }
}
