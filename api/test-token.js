// pages/api/test-token.js
import { getAccessToken } from "../lib/dropbox.js";
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const token = await getAccessToken();
    const testRes = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await testRes.json();
    if (!testRes.ok) throw new Error(JSON.stringify(data));

    res.status(200).json({ working: true, account: data });
  } catch (err) {
    console.error("Token test failed:", err);
    res.status(500).json({ error: err.message });
  }
}
