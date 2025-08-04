export default function handler(req, res) {
  // ✅ Only allow from your site by checking Referer header
  const referer = req.headers.referer || "";
  if (!referer.includes("camoufly.me")) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // ✅ Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ Get token from environment variables (never hardcode)
  const DROPBOX_PERMANENT_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;
  if (!DROPBOX_PERMANENT_TOKEN) {
    return res.status(500).json({ error: "Dropbox token not configured" });
  }

  // ✅ Return token as JSON
  res.status(200).json({ token: DROPBOX_PERMANENT_TOKEN });
}
