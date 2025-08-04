import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, message, fileName, fileData } = req.body;

    // Upload to Dropbox
    await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DROPBOX_ACCESS_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: `/music_submissions/${Date.now()}-${fileName}`,
          mode: "add",
          autorename: true,
          mute: false
        }),
        "Content-Type": "application/octet-stream"
      },
      body: Buffer.from(fileData, "base64")
    });

    res.status(200).json({ success: true, message: "File uploaded to Dropbox!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
