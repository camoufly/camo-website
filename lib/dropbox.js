// lib/dropbox.js
import fetch from "node-fetch";

export async function getAccessToken() {
  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: process.env.DROPBOX_REFRESH_TOKEN,
      grant_type: "refresh_token",
      client_id: process.env.DROPBOX_APP_KEY,
      client_secret: process.env.DROPBOX_APP_SECRET,
    }),
  });

  const data = await response.text();
  console.log("Dropbox token response:", data);

  if (!response.ok) {
    throw new Error("Failed to refresh token: " + data);
  }

  return JSON.parse(data).access_token;
}
