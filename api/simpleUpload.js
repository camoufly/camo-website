// pages/api/simpleUpload.js
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false, // Stream raw binary
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const DROPBOX_PERMANENT_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;
    if (!DROPBOX_PERMANENT_TOKEN) throw new Error("Missing Dropbox token");

    const dropboxPath = req.headers["x-dropbox-path"];
    if (!dropboxPath) throw new Error("Missing x-dropbox-path header");

    const uploadRes = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DROPBOX_PERMANENT_TOKEN}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          path: dropboxPath,
          mode: "add",
          autorename: true,
          mute: false
        }),
      },
      body: req, // Stream file directly
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Dropbox upload failed: ${errText}`);
    }

    const data = await uploadRes.json();
    res.status(200).json({ success: true, file: data });
  } catch (err) {
    console.error("simpleUpload error:", err);
    res.status(500).json({ error: err.message });
  }
}
