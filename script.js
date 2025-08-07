console.log("✅ Script loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");

  const CHUNK_SIZE = 16 * 1024 * 1024; // 16MB safe for Vercel Pro

  const musicForm = document.getElementById("musicForm");
  const fileInput = document.getElementById("input-file");
  const artistNameInput = document.getElementById("artistName");
  const emailInput = document.getElementById("email");
  const uploadStatus = document.getElementById("uploadStatus");

  // Animate button
  document.querySelectorAll(".button").forEach(btn =>
    btn.addEventListener("click", e => {
      e.preventDefault();
      btn.classList.remove("animate");
      btn.classList.add("animate");
      setTimeout(() => btn.classList.remove("animate"), 700);
    })
  );

  // Drag & Drop functionality
  const dropArea = document.getElementById("drop-area");
  ["dragenter", "dragover", "dragleave", "drop"].forEach(event =>
    dropArea.addEventListener(event, e => {
      e.preventDefault();
      e.stopPropagation();
    })
  );
  ["dragenter", "dragover"].forEach(event =>
    dropArea.addEventListener(event, () => dropArea.classList.add("active"))
  );
  ["dragleave", "drop"].forEach(event =>
    dropArea.addEventListener(event, () => dropArea.classList.remove("active"))
  );
  dropArea.addEventListener("drop", e => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  // File selection status
  fileInput?.addEventListener("change", () => {
    if (fileInput.files.length > 5) {
      uploadStatus.textContent = "⚠️ You can upload a maximum of 5 files.";
      fileInput.value = "";
      return;
    }
    uploadStatus.textContent = `📁 ${fileInput.files.length} file(s) selected.`;
  });

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
        // Direct small upload
        const appendRes = await fetch("/api/appendUpload", {
          method: "POST",
          headers: {
            "x-dropbox-session-id": sessionId,
            "x-dropbox-offset": 0
          },
          body: file
        });

        if (!appendRes.ok) throw new Error("Upload failed");
        uploadStatus.textContent = `📤 [${index + 1}/${totalFiles}] Uploading... 100%`;
      } else {
        // Chunked upload
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

          if (!appendRes.ok) {
            const errText = await appendRes.text();
            throw new Error(`Chunk ${chunkIndex + 1} failed — ${errText}`);
          }

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

      if (!finishRes.ok) {
        const errText = await finishRes.text();
        throw new Error(`Finalize failed: ${errText}`);
      }

      uploadStatus.textContent = `✅ [${index + 1}/${totalFiles}] Finished: ${file.name}`;
    } catch (err) {
      console.error("Upload error:", err.message);
      uploadStatus.textContent = `❌ [${index + 1}/${totalFiles}] Failed: ${err.message}`;
    }
  }

  // Submit handler
  if (musicForm) {
    console.log("✅ Binding form submit");
    musicForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      console.log("✅ Form submitted");

      if (!fileInput.files.length) {
        uploadStatus.textContent = "⚠️ Please select a file.";
        return;
      }
      if (!artistNameInput.value.trim() || !emailInput.value.trim()) {
        uploadStatus.textContent = "⚠️ Please fill out all fields.";
        return;
      }

      const files = Array.from(fileInput.files);
      if (files.length > 5) {
        uploadStatus.textContent = "⚠️ Max 5 files.";
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
