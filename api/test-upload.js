// pages/api/test-token.js
import { getAccessToken } from "../lib/dropbox.js";

export default async function handler(req, res) {
  try {
    const token = await getAccessToken();
    res.status(200).json({ token });
  } catch (err) {
    console.error("token error:", err);
    res.status(500).json({ error: err.message });
  }
}