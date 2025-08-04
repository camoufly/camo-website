import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false // We are streaming binary data
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const DROPBOX_PERMANENT_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;
    if (!DROPBOX_PERMANENT_TOKEN) {
      throw new Error("Dropbox permanent token not configured.");
    }

    const sessionId = req.headers["x-dropbox-session-id"];
    const offset = parseInt(req.headers["x-dropbox-offset"], 10);

    if (!sessionId || isNaN(offset)) {
      throw new Error("Missing required headers: x-dropbox-session-id and x-dropbox-offset");
    }

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
      body: req // Pass binary directly
    });

    if (!appendRes.ok) {
      const errText = await appendRes.text();
      throw new Error(`Dropbox append failed: ${errText}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("appendUpload error:", error);
    res.status(500).json({ error: error.message });
  }
}
