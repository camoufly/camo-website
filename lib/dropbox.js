// lib/dropbox.js
import fetch from "node-fetch";

export async function getAccessToken() {
  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
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

  const raw = await response.text(); // <- This will be HTML or plain text if it fails
  console.log("🔍 Dropbox token response:", raw);

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("❌ Dropbox token response is not valid JSON");
  }

  if (!response.ok) {
    console.error("❌ Failed to refresh token:", data);
    throw new Error(data.error_description || "Could not refresh Dropbox token");
  }

  return data.access_token;
}
