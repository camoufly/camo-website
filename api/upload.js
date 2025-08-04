import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, message, fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: "Missing file or file data" });
    }

    // Upload to Dropbox
    const dropboxPath = `/music_submissions/${Date.now()}-${fileName}`;

    const uploadResponse = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DROPBOX_ACCESS_TOKEN}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: dropboxPath,
          mode: "add",
          autorename: true,
          mute: false
        }),
        "Content-Type": "application/octet-stream"
      },
      body: Buffer.from(fileData, "base64")
    });

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      throw new Error(`Dropbox upload failed: ${errText}`);
    }

    // Optional: create a shared link (so you get a public URL in email later)
    const linkResponse = await fetch("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DROPBOX_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ path: dropboxPath })
    });

    const linkData = await linkResponse.json();
    const fileUrl = linkData.url ? linkData.url.replace("?dl=0", "?dl=1") : null;

    // Success response
    res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      link: fileUrl
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
