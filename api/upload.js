import multer from "multer";
import fs from "fs";
import fetch from "node-fetch";

const upload = multer({ dest: "/tmp" }); // Vercel's temporary storage

export const config = {
  api: {
    bodyParser: false, // Let multer handle file parsing
  },
};

export default function handler(req, res) {
  upload.single("track")(req, res, async (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "File upload error" });
    }

    // Secure: read token from environment variable
    const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_TOKEN;
    if (!DROPBOX_ACCESS_TOKEN) {
      return res.status(500).json({ error: "Dropbox token not configured" });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks

    try {
      const dropboxPath = `/MusicUploads/${fileName}`;
      const fileSize = fs.statSync(filePath).size;
      const fd = fs.openSync(filePath, "r");

      // 1️⃣ Start session
      let buffer = Buffer.alloc(CHUNK_SIZE);
      let bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, null);
      let startResp = await fetch("https://content.dropboxapi.com/2/files/upload_session/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DROPBOX_ACCESS_TOKEN}`,
          "Dropbox-API-Arg": JSON.stringify({ close: false }),
          "Content-Type": "application/octet-stream",
        },
        body: buffer.slice(0, bytesRead),
      });
      let startData = await startResp.json();
      let sessionId = startData.session_id;
      let offset = bytesRead;

      // 2️⃣ Append chunks
      while ((bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, null)) > 0) {
        await fetch("https://content.dropboxapi.com/2/files/upload_session/append_v2", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${DROPBOX_ACCESS_TOKEN}`,
            "Dropbox-API-Arg": JSON.stringify({
              cursor: { session_id: sessionId, offset },
              close: false,
            }),
            "Content-Type": "application/octet-stream",
          },
          body: buffer.slice(0, bytesRead),
        });
        offset += bytesRead;
      }

      // 3️⃣ Finish upload
      await fetch("https://content.dropboxapi.com/2/files/upload_session/finish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DROPBOX_ACCESS_TOKEN}`,
          "Dropbox-API-Arg": JSON.stringify({
            cursor: { session_id: sessionId, offset },
            commit: { path: dropboxPath, mode: "add", autorename: true, mute: false },
          }),
          "Content-Type": "application/octet-stream",
        },
        body: "",
      });

      fs.closeSync(fd);
      fs.unlinkSync(filePath);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      fs.unlinkSync(filePath);
      return res.status(500).json({ error: "Dropbox upload failed" });
    }
  });
}
