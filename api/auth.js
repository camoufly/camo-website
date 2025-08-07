// api/auth.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    const authorizeUrl = new URL("https://www.dropbox.com/oauth2/authorize");
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", process.env.DROPBOX_APP_KEY);
    authorizeUrl.searchParams.set("token_access_type", "offline");
    authorizeUrl.searchParams.set("redirect_uri", "https://camoufly.me/api/auth");

    return res.redirect(authorizeUrl.toString());
  }

  try {
    const tokenRes = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: process.env.DROPBOX_APP_KEY,
        client_secret: process.env.DROPBOX_APP_SECRET,
        redirect_uri: "https://camoufly.me/api/auth"
      })
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("❌ Failed to get token:", data);
      return res.status(500).json({ error: data });
    }

    return res.status(200).json({
      message: "✅ Refresh token generated successfully!",
      refresh_token: data.refresh_token,
      access_token: data.access_token,
      expires_in: data.expires_in,
      account_id: data.account_id
    });
  } catch (err) {
    console.error("auth error:", err);
    return res.status(500).json({ error: err.message });
  }
}
