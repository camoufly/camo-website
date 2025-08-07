// lib/dropbox.js
import fetch from "node-fetch";

export async function getAccessToken() {
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: process.env.DROPBOX_REFRESH_TOKEN,
      grant_type: "refresh_token",
      client_id: process.env.DROPBOX_APP_KEY,
      client_secret: process.env.DROPBOX_APP_SECRET,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || "Failed to refresh Dropbox access token");
  }
  return data.access_token;
}
