import { getAccessToken } from "../lib/dropbox.js";
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const token = await getAccessToken();

    const info = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await info.json();
    if (!info.ok) {
      console.error("Dropbox API error:", data);
      return res.status(500).json({ error: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
