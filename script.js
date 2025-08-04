document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     Button click animation
  ========================= */
  const animateButton = (e) => {
    e.preventDefault();
    e.target.classList.remove("animate");
    e.target.classList.add("animate");
    setTimeout(() => e.target.classList.remove("animate"), 700);
  };
  document.querySelectorAll(".button").forEach(btn =>
    btn.addEventListener("click", animateButton)
  );

  /* =========================
     Drag-and-drop functionality
  ========================= */
  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("input-file");
  const uploadStatus = document.getElementById("uploadStatus");

  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  ["dragenter", "dragover"].forEach(() => dropArea.classList.add("active"));
  ["dragleave", "drop"].forEach(() => dropArea.classList.remove("active"));

  dropArea.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 5) {
      uploadStatus.textContent = "⚠️ You can only upload a maximum of 5 files.";
      return;
    }
    if (files.length) {
      fileInput.files = files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  /* =========================
     File select update + max 5
  ========================= */
  fileInput?.addEventListener("change", () => {
    if (fileInput.files.length > 5) {
      uploadStatus.textContent = "⚠️ You can only upload a maximum of 5 files.";
      fileInput.value = ""; // Clear selection
      return;
    }
    if (fileInput.files.length > 0) {
      uploadStatus.textContent =
        fileInput.files.length === 1
          ? `📁 File selected: ${fileInput.files[0].name}`
          : `📁 ${fileInput.files.length} files selected.`;
    } else {
      uploadStatus.textContent = "";
    }
  });

  /* =========================
     Music Upload to Dropbox
  ========================= */
  const musicForm = document.getElementById("musicForm");
  const artistNameInput = document.getElementById("artistName");
  const emailInput = document.getElementById("email");

  const CHUNK_SIZE = 16 * 1024 * 1024; // 16MB for Vercel Pro
  const MAX_DIRECT_UPLOAD = 100 * 1024 * 1024; // 100MB for direct

  async function uploadSingleFile(file, index, totalFiles) {
    const now = new Date();
    const dateFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const folderPath = `/MusicUploads/${dateFolder}`;

    // Preserve original extension
    const extension = file.name.split('.').pop();
    const originalNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

    // Format: [artist] - [originalFilename] ([email]).ext
    const baseFileName = `${artistNameInput.value.trim()} - ${originalNameWithoutExt} (${emailInput.value.trim()})`;
    const dropboxPath = `${folderPath}/${baseFileName}.${extension}`;

    try {
      if (file.size <= MAX_DIRECT_UPLOAD) {
        /* Direct upload */
        uploadStatus.textContent = `📤 [${index + 1}/${totalFiles}] Uploading: ${file.name}... 0%`;

        const tokenRes = await fetch("/api/getToken");
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.token) throw new Error("Token request failed");

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "https://content.dropboxapi.com/2/files/upload");
          xhr.setRequestHeader("Authorization", `Bearer ${tokenData.token}`);
          xhr.setRequestHeader("Dropbox-API-Arg", JSON.stringify({
            path: dropboxPath,
            mode: "add",
            autorename: true,
            mute: false
          }));
          xhr.setRequestHeader("Content-Type", "application/octet-stream");

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              uploadStatus.textContent = `📤 [${index + 1}/${totalFiles}] Uploading: ${file.name}... ${percent}%`;
            }
          };

          xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error(xhr.responseText));
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(file);
        });

        uploadStatus.textContent = `✅ [${index + 1}/${totalFiles}] Finished: ${file.name}`;
      } else {
        /* Chunked upload */
        uploadStatus.textContent = `📤 [${index + 1}/${totalFiles}] Starting chunked upload: ${file.name}`;

        const startRes = await fetch("/api/startUpload", { method: "POST" });
        const startData = await startRes.json();
        if (!startRes.ok || !startData.session_id) throw new Error("Failed to start upload session");

        const sessionId = startData.session_id;
        let offset = 0;
        let chunkIndex = 0;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        while (offset < file.size) {
          const chunk = file.slice(offset, offset + CHUNK_SIZE);
          const appendRes = await fetch("/api/appendUpload", {
            method: "POST",
            headers: {
              "x-dropbox-session-id": sessionId,
              "x-dropbox-offset": offset
            },
            body: chunk
          });

          if (!appendRes.ok) throw new Error(`Failed chunk ${chunkIndex + 1}`);

          offset += CHUNK_SIZE;
          chunkIndex++;
          const percent = Math.round((chunkIndex / totalChunks) * 100);
          uploadStatus.textContent = `📤 [${index + 1}/${totalFiles}] Uploading: ${file.name}... ${percent}%`;
        }

        const finishRes = await fetch("/api/finishUpload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, offset: file.size, dropboxPath })
        });
        if (!finishRes.ok) throw new Error("Failed to finish upload");

        uploadStatus.textContent = `✅ [${index + 1}/${totalFiles}] Finished: ${file.name}`;
      }
    } catch (err) {
      console.error(err);
      uploadStatus.textContent = `❌ [${index + 1}/${totalFiles}] Failed: ${file.name} — ${err.message}`;
    }
  }

  if (musicForm) {
    musicForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!fileInput.files.length) {
        uploadStatus.textContent = "⚠️ Please select a file.";
        return;
      }
      if (fileInput.files.length > 5) {
        uploadStatus.textContent = "⚠️ You can only upload a maximum of 5 files.";
        return;
      }
      if (!artistNameInput.value.trim() || !emailInput.value.trim()) {
        uploadStatus.textContent = "⚠️ Please fill out all fields.";
        return;
      }

      const files = Array.from(fileInput.files);
      for (let i = 0; i < files.length; i++) {
        await uploadSingleFile(files[i], i, files.length);
      }

      fileInput.value = "";
      artistNameInput.value = "";
      emailInput.value = "";
      uploadStatus.textContent += " 🎉 All uploads completed!";
    });
  }
});
