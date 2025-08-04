export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const DROPBOX_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;
    if (!DROPBOX_TOKEN) {
      return res.status(500).json({ error: "Dropbox token not configured" });
    }

    const startRes = await fetch("https://content.dropboxapi.com/2/files/upload_session/start", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({ close: false }),
        "Content-Type": "application/octet-stream"
      },
      body: "" // no data yet, just start session
    });

    const startData = await startRes.json();
    if (!startRes.ok) {
      return res.status(startRes.status).json(startData);
    }

    res.status(200).json({ session_id: startData.session_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start upload" });
  }
}
