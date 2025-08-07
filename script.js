console.log("✅ Script loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");

  const musicForm = document.getElementById("musicForm");
  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("input-file");
  const uploadStatus = document.getElementById("uploadStatus");
  const artistNameInput = document.getElementById("artistName");
  const emailInput = document.getElementById("email");
  const CHUNK_SIZE = 32 * 1024 * 1024; // 32MB for Vercel Pro

  if (!musicForm || !fileInput || !dropArea) {
    console.error("❌ Missing DOM elements");
    return;
  }

  /* =========================
     Upload Button Animation
  ========================= */
  document.querySelectorAll(".button").forEach(btn =>
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      btn.classList.remove("animate");
      btn.classList.add("animate");
      setTimeout(() => btn.classList.remove("animate"), 700);
    })
  );

  /* =========================
     Drag & Drop
  ========================= */
  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
  ["dragenter", "dragover"].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.add("active"));
  });
  ["dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.remove("active"));
  });
  dropArea.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 5) {
      uploadStatus.textContent = "⚠️ Max 5 files allowed.";
      return;
    }
    fileInput.files = files;
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
  });

  /* =========================
     File Select Status
  ========================= */
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 5) {
      uploadStatus.textContent = "⚠️ You can upload a maximum of 5 files.";
      fileInput.value = "";
    } else if (fileInput.files.length > 0) {
      uploadStatus.textContent = `📁 ${fileInput.files.length} file(s) selected.`;
    } else {
      uploadStatus.textContent = "";
    }
  });

  /* =========================
     Upload Handler
  ========================= */
  async function uploadSingleFile(file, index, totalFiles) {
    const now = new Date();
    const folderPath = `/MusicUploads/${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const extension = file.name.split('.').pop();
    const dropboxPath = `${folderPath}/${artistNameInput.value.trim()} - ${file.name} (${emailInput.value.trim()}).${extension}`;

    try {
      uploadStatus.textContent = `📤 [${index + 1}/${totalFiles}] Starting upload...`;

      // 1️⃣ Start session
      const startRes = await fetch("/api/startUpload", { method: "POST" });
      const startData = await startRes.json();
      if (!startRes.ok || !startData.session_id) throw new Error(startData.error || "startUpload failed");
      const sessionId = startData.session_id;

      // 2️⃣ Upload (chunked or full)
      if (file.size <= CHUNK_SIZE) {
        const res = await fetch("/api/appendUpload", {
          method: "POST",
          headers: {
            "x-dropbox-session-id": sessionId,
            "x-dropbox-offset": "0"
          },
          body: file
        });
        if (!res.ok) throw new Error("appendUpload failed (single)");
      } else {
        let offset = 0;
        let chunkIndex = 0;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        while (offset < file.size) {
          const chunk = file.slice(offset, offset + CHUNK_SIZE);
          const res = await fetch("/api/appendUpload", {
            method: "POST",
            headers: {
              "x-dropbox-session-id": sessionId,
              "x-dropbox-offset": offset
            },
            body: chunk
          });
          if (!res.ok) throw new Error(`appendUpload failed on chunk ${chunkIndex + 1}`);
          offset += CHUNK_SIZE;
          chunkIndex++;
          const percent = Math.min(100, Math.round((chunkIndex / totalChunks) * 100));
          uploadStatus.textContent = `📤 [${index + 1}/${totalFiles}] Uploading... ${percent}%`;
        }
      }

      // 3️⃣ Finish
      const finishRes = await fetch("/api/finishUpload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, offset: file.size, dropboxPath })
      });
      if (!finishRes.ok) throw new Error("finishUpload failed");

      uploadStatus.textContent = `✅ [${index + 1}/${totalFiles}] Uploaded: ${file.name}`;
    } catch (err) {
      console.error(err);
      uploadStatus.textContent = `❌ [${index + 1}/${totalFiles}] Failed: ${err.message}`;
    }
  }

  /* =========================
     Submit Handler
  ========================= */
  musicForm.addEventListener("submit", async (e) => {
    console.log("✅ Form submitted");
    e.preventDefault();

    if (!fileInput.files.length) {
      uploadStatus.textContent = "⚠️ Please select a file.";
      return;
    }
    if (fileInput.files.length > 5) {
      uploadStatus.textContent = "⚠️ Max 5 files allowed.";
      return;
    }
    if (!artistNameInput.value.trim() || !emailInput.value.trim()) {
      uploadStatus.textContent = "⚠️ Fill out all fields.";
      return;
    }

    const files = Array.from(fileInput.files);
    for (let i = 0; i < files.length; i++) {
      await uploadSingleFile(files[i], i, files.length);
    }

    uploadStatus.textContent += " 🎉 All uploads completed!";
    fileInput.value = "";
    artistNameInput.value = "";
    emailInput.value = "";
  });
});
