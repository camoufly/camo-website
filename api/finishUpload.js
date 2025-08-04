export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const DROPBOX_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;
  if (!DROPBOX_TOKEN) {
    return res.status(500).json({ error: "Dropbox token not configured" });
  }

  const { session_id, offset, dropboxPath } = req.body;
  if (!session_id || typeof offset !== "number" || !dropboxPath) {
    return res.status(400).json({ error: "Missing session_id, offset, or dropboxPath" });
  }

  try {
    const finishRes = await fetch("https://content.dropboxapi.com/2/files/upload_session/finish", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({
          cursor: { session_id, offset },
          commit: { path: dropboxPath, mode: "add", autorename: true, mute: false }
        }),
        "Content-Type": "application/octet-stream"
      },
      body: "" // no file data here
    });

    const finishData = await finishRes.json();
    if (!finishRes.ok) {
      return res.status(finishRes.status).json(finishData);
    }

    res.status(200).json({ success: true, file: finishData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to finish upload" });
  }
}
