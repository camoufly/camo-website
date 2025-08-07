// lib/dropbox.js
import fetch from "node-fetch";

let cachedAccessToken = null;
let tokenExpiry = 0;

export async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if it's still valid
  if (cachedAccessToken && now < tokenExpiry - 60) {
    return cachedAccessToken;
  }

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", process.env.DROPBOX_REFRESH_TOKEN);
  params.append("client_id", process.env.DROPBOX_APP_KEY);
  params.append("client_secret", process.env.DROPBOX_APP_SECRET);

  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("⚠️ Failed to refresh access token:", data);
    throw new Error("Could not refresh Dropbox access token");
  }

  cachedAccessToken = data.access_token;
  tokenExpiry = now + data.expires_in;

  return cachedAccessToken;
}
