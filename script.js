console.log("✅ Script loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");

  const animateButton = (e) => {
    e.preventDefault();
    e.target.classList.remove("animate");
    e.target.classList.add("animate");
    setTimeout(() => e.target.classList.remove("animate"), 700);
  };
  document.querySelectorAll(".button").forEach(btn =>
    btn.addEventListener("click", animateButton)
  );

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

  fileInput?.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      if (fileInput.files.length > 5) {
        uploadStatus.textContent = "Too many files. Maximum allowed is 5.";
        fileInput.value = "";
      } else {
        uploadStatus.textContent = `${fileInput.files.length} file(s) selected.`;
      }
    } else {
      uploadStatus.textContent = "";
    }
  });

  const musicForm = document.getElementById("musicForm");
  const artistNameInput = document.getElementById("artistName");
  const emailInput = document.getElementById("email");
  const CHUNK_SIZE = 16 * 1024 * 1024; // 16MB max size per upload chunk

  async function uploadSingleFile(file, index, totalFiles) {
    const now = new Date();
    const dateFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const folderPath = `/MusicUploads/${dateFolder}`;
    const extension = file.name.split('.').pop();
    const dropboxPath = `${folderPath}/${artistNameInput.value.trim()} - ${file.name} (${emailInput.value.trim()}).${extension}`;

    try {
      uploadStatus.textContent = `[${index + 1}/${totalFiles}] Starting upload...`;
      const startRes = await fetch("/api/startUpload", { method: "POST" });
      const startData = await startRes.json();
      if (!startRes.ok || !startData.session_id) throw new Error(startData.error || "Start session failed");

      const sessionId = startData.session_id;

      if (file.size <= CHUNK_SIZE) {
        const res = await fetch("/api/appendUpload", {
          method: "POST",
          headers: {
            "x-dropbox-session-id": sessionId,
            "x-dropbox-offset": 0
          },
          body: file
        });
        if (!res.ok) throw new Error("Upload failed for small file.");
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
          if (!res.ok) throw new Error(`Upload failed at chunk ${chunkIndex + 1}`);
          offset += CHUNK_SIZE;
          chunkIndex++;
          const percent = Math.min(100, Math.round((chunkIndex / totalChunks) * 100));
          uploadStatus.textContent = `[${index + 1}/${totalFiles}] Uploading... ${percent}%`;
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

      uploadStatus.textContent = `[${index + 1}/${totalFiles}] Upload complete: ${file.name}`;
      return true;
    } catch (err) {
      console.error(err);
      uploadStatus.textContent = `[${index + 1}/${totalFiles}] Failed: ${err.message}`;
      return false;
    }
  }

  if (musicForm) {
    musicForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!fileInput.files.length) {
        uploadStatus.textContent = "Please select a file to upload.";
        return;
      }

      if (!artistNameInput.value.trim() || !emailInput.value.trim()) {
        uploadStatus.textContent = "Please fill in all fields.";
        return;
      }

      const files = Array.from(fileInput.files);
      if (files.length > 5) {
        uploadStatus.textContent = "You can upload a maximum of 5 files.";
        return;
      }

      uploadStatus.textContent = "Preparing upload...";
      let successCount = 0;

      for (let i = 0; i < files.length; i++) {
        const success = await uploadSingleFile(files[i], i, files.length);
        if (success) successCount++;
      }

      if (successCount === files.length) {
        uploadStatus.textContent = `All uploads completed successfully.`;
      } else {
        uploadStatus.textContent += ` Some uploads failed.`;
      }

      fileInput.value = "";
      artistNameInput.value = "";
      emailInput.value = "";
    });
  } else {
    console.log("❌ musicForm not found");
  }
});
