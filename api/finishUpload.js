// pages/api/finishUpload.js
import fetch from "node-fetch";
import { getAccessToken } from "../../lib/dropbox";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = await getAccessToken();

    const { session_id, offset, dropboxPath } = req.body;
    if (!session_id || typeof offset !== "number" || !dropboxPath) {
      throw new Error("Missing required fields: session_id, offset, dropboxPath");
    }

    const finishRes = await fetch("https://content.dropboxapi.com/2/files/upload_session/finish", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({
          cursor: { session_id, offset },
          commit: {
            path: dropboxPath,
            mode: "add",
            autorename: true,
            mute: false
          }
        }),
        "Content-Type": "application/octet-stream"
      },
      body: ""
    });

    const data = await finishRes.json();
    if (!finishRes.ok) {
      throw new Error(data.error_summary || "Failed to finish upload");
    }

    res.status(200).json({ success: true, file: data });
  } catch (error) {
    console.error("finishUpload error:", error);
    res.status(500).json({ error: error.message });
  }
}
