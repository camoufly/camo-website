// lib/dropbox.js

export async function getAccessToken() {
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.DROPBOX_REFRESH_TOKEN,
      client_id: process.env.DROPBOX_APP_KEY,
      client_secret: process.env.DROPBOX_APP_SECRET
    })
  });

  const json = await res.json();

  // ✅ DEBUG LOG (will show in Vercel Logs)
  console.log("🔑 Dropbox access_token:", json.access_token);
  console.log("📦 Full Dropbox token response:", json);

  if (!res.ok) {
    throw new Error(json.error_description || "Failed to refresh Dropbox token");
  }

  return json.access_token;
}
