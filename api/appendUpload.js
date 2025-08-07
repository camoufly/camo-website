// pages/api/appendUpload.js
import fetch from "node-fetch";
import { getAccessToken } from "../../lib/dropbox";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = await getAccessToken();

    const sessionId = req.headers["x-dropbox-session-id"];
    const offset = parseInt(req.headers["x-dropbox-offset"], 10);

    if (!sessionId || isNaN(offset)) {
      throw new Error("Missing required headers: x-dropbox-session-id and x-dropbox-offset");
    }

    const appendRes = await fetch("https://content.dropboxapi.com/2/files/upload_session/append_v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({
          cursor: { session_id: sessionId, offset },
          close: false
        }),
        "Content-Type": "application/octet-stream"
      },
      body: req
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
