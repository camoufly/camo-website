export const config = {
  api: {
    bodyParser: false // We handle raw body ourselves
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const DROPBOX_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;
  if (!DROPBOX_TOKEN) {
    return res.status(500).json({ error: "Dropbox token not configured" });
  }

  const sessionId = req.headers["x-dropbox-session-id"];
  const offset = parseInt(req.headers["x-dropbox-offset"], 10);

  if (!sessionId || isNaN(offset)) {
    return res.status(400).json({ error: "Missing session_id or offset" });
  }

  try {
    // Read raw body into buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    // Safety check for Vercel Free limit (~4.5MB)
    if (fileBuffer.length > 4.2 * 1024 * 1024) {
      return res.status(413).json({ error: "Chunk too large for Vercel Free plan" });
    }

    const appendRes = await fetch("https://content.dropboxapi.com/2/files/upload_session/append_v2", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({
          cursor: { session_id: sessionId, offset },
          close: false
        }),
        "Content-Type": "application/octet-stream"
      },
      body: fileBuffer
    });

    if (!appendRes.ok) {
      const errorData = await appendRes.text();
      return res.status(appendRes.status).send(errorData);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to append chunk" });
  }
}
