// pages/api/test-token.js
import { getAccessToken } from "../lib/dropbox.js";

export default async function handler(req, res) {
  try {
    const token = await getAccessToken(); // this may now throw a clearer error

    const info = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const raw = await info.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("📛 Dropbox user info returned non-JSON:", raw);
      throw new Error("Dropbox user info returned non-JSON");
    }

    if (!info.ok) {
      console.error("🚫 Dropbox user info error:", data);
      throw new Error(data.error_summary || "Unknown Dropbox error");
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
