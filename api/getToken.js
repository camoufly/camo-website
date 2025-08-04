import fetch from "node-fetch";

export default async function handler(req, res) {
  // ✅ Allow cross-origin requests from your site
  res.setHeader("Access-Control-Allow-Origin", "https://camoufly.me");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests (OPTIONS method)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const DROPBOX_PERMANENT_TOKEN = process.env.DROPBOX_PERMANENT_TOKEN;
    if (!DROPBOX_PERMANENT_TOKEN) {
      return res.status(500).json({ error: "Dropbox permanent token not configured" });
    }

    // Request a short-lived token from Dropbox
    const response = await fetch("https://api.dropboxapi.com/2/token/get_short_lived_token", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DROPBOX_PERMANENT_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        scopes: ["files.content.write"] // only allow uploads
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Dropbox API error: ${errText}`);
    }

    const data = await response.json();
    return res.status(200).json({
      token: data.access_token,
      expires_in: data.expires_in
    });
  } catch (error) {
    console.error(error);
