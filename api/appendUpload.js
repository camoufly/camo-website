import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false // We're handling binary data manually
  }
};

// Helper to buffer the incoming binary stream
function bufferRequest(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const DROPBOX_PERMANENT_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;
    if (!DROPBOX_PERMANENT_TOKEN) {
      throw new Error("Dropbox token not found.");
    }

    const sessionId = req.headers["x-dropbox-session-id"];
    const offset = parseInt(req.headers["x-dropbox-offset"], 10);

    if (!sessionId || isNaN(offset)) {
      throw new Error("Missing or invalid headers: x-dropbox-session-id or x-dropbox-offset");
    }

    const binaryData = await bufferRequest(req); // ✅ buffer the file from req

    const response = await fetch("https://content.dropboxapi.com/2/files/upload_session/append_v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DROPBOX_PERMANENT_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({
          cursor: {
            session_id: sessionId,
            offset: offset
          },
          close: false
        }),
        "Content-Type": "application/octet-stream"
      },
      body: binaryData // ✅ Send raw buffer only
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Dropbox append failed: ${errText}`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("appendUpload error:", err);
    res.status(500).json({ error: err.message });
  }
}
