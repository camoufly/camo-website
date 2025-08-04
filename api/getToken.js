export default function handler(req, res) {
  const DROPBOX_PERMANENT_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;

  if (!DROPBOX_PERMANENT_TOKEN) {
    return res.status(500).json({ error: "Dropbox token not configured" });
  }

  // Optional: Restrict to GET only
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Send token to browser (in JSON)
  res.status(200).json({ token: DROPBOX_PERMANENT_TOKEN });
}
