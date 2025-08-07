console.log("✅ Script loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");

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
     Drag & Drop
  ========================= */
  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("input-file");
  const uploadStatus = document.getElementById("uploadStatus");

  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName =>
    dropArea.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
    })
  );
  ["dragenter", "dragover"].forEach(eventName =>
    dropArea.addEventListener(eventName, () => dropArea.classList.add("active"))
  );
  ["dragleave", "drop"].forEach(eventName =>
    dropArea.addEventListener(eventName, () => dropArea.classList.remove("active"))
  );
  dropArea.addEventListener("drop", e => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  /* =========================
     File selection status
  ========================= */
  fileInput?.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      if (fileInput.files.length > 5) {
        uploadStatus.textContent = "⚠️ You can upload a maximum of 5 files.";
        fileInput.value = "";
      } else {
        uploadStatus.textContent = `📁 ${fileInput.files.length} file(s) selected.`;
      }
    } else {
      uploadStatus.textContent = "";
    }
  });

  /* =========================
     Upload Logic
  ========================= */
  const musicForm = document.getElementById("musicForm");
  const artistNameInput = document.getElementById("artistName");
  const emailInput = document.getElementById("email");

  const CHUNK_SIZE = 32 * 1024 * 1024; // 32MB for Pro

  async function uploadSingleFile(file, index, totalFiles) {
    const now = new Date();
    const dateFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const folderPath = `/MusicUploads/${dateFolder}`;
    const extension = file.name.split('.').pop();
    const dropboxPath = `${folderPath}/${artistNameInput.value.trim()} - ${file.name} (${emailInput.value.trim()}).${extension}`;

    try {
      uploadStatus.textContent = `📤 [${index + 1}/${totalFiles}] Starting upload...`;
      const startRes = await fetch("/api/startUpload", { method: "POST" });
      const startData = await startRes.json();
      if (!startRes.ok || !startData.session_id) throw new Error(startData.error || "Start session failed");

      const sessionId = startData.session_id;

      if (file.size <= CHUNK_SIZE) {
        const appendRes = await fetch("/api/appendUpload", {
          method: "POST",
          headers: { "x-dropbox-session-id": sessionId, "x-dropbox-offset": 0 },
          body: file
        });
        if (!appendRes.ok) throw new Error("Upload failed");
      } else {
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
          if (!appendRes.ok) throw new Error(`Chunk ${chunkIndex + 1} failed`);
          offset += CHUNK_SIZE;
          chunkIndex++;
          const percent = Math.min(100, Math.round((chunkIndex / totalChunks) * 100));
          uploadStatus.textContent = `📤 [${index + 1}/${totalFiles}] Uploading... ${percent}%`;
        }
      }

      const finishRes = await fetch("/api/finishUpload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          offset: file.size,
          dropboxPath
        })
      });
      if (!finishRes.ok) throw new Error("Finalize failed");

      uploadStatus.textContent = `✅ [${index + 1}/${totalFiles}] Finished: ${file.name}`;
    } catch (err) {
      console.error(err);
      uploadStatus.textContent = `❌ [${index + 1}/${totalFiles}] Failed: ${err.message}`;
    }
  }

  if (musicForm) {
    console.log("✅ musicForm:", musicForm);
    musicForm.addEventListener("submit", async function (e) {
      console.log("✅ Form submitted");
      e.preventDefault();
      if (!fileInput.files.length) return uploadStatus.textContent = "⚠️ Please select a file.";
      if (!artistNameInput.value.trim() || !emailInput.value.trim())
        return uploadStatus.textContent = "⚠️ Fill out all fields.";

      const files = Array.from(fileInput.files);
      if (files.length > 5) {
        uploadStatus.textContent = "⚠️ You can upload a maximum of 5 files.";
        return;
      }

      for (let i = 0; i < files.length; i++) {
        await uploadSingleFile(files[i], i, files.length);
      }

      uploadStatus.textContent += " 🎉 All uploads completed!";
      fileInput.value = "";
      artistNameInput.value = "";
      emailInput.value = "";
    });
  } else {
    console.log("❌ musicForm not found");
  }
});
