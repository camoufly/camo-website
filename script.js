console.log("✅ Script loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");

  // Grab DOM elements
  const musicForm = document.getElementById("musicForm");
  const inputFile = document.getElementById("input-file");
  const uploadStatus = document.getElementById("uploadStatus");
  const dropArea = document.getElementById("drop-area");
  const imgView = document.getElementById("img-view");
  const fileInfo = document.createElement("p");
  imgView.appendChild(fileInfo);

  // Ensure all required elements exist
  if (!musicForm || !inputFile || !uploadStatus || !dropArea) {
    console.error("❌ Missing form, input, status, or drop area element");
    return;
  }

  // === 📁 Display file selection status ===
  function updateFileInfoDisplay() {
    const count = inputFile.files.length;
    if (count === 0) {
      fileInfo.textContent = "No files selected.";
    } else if (count === 1) {
      fileInfo.textContent = "1 file selected (up to 5)";
    } else {
      fileInfo.textContent = `${count} files selected (up to 5)`;
    }
  }

  // === 🎯 Drag and drop logic ===
  ["dragenter", "dragover"].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.add("active");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.remove("active");
    });
  });

  dropArea.addEventListener("drop", (e) => {
    const droppedFiles = Array.from(e.dataTransfer.files);
    const currentFiles = Array.from(inputFile.files);
    const combinedFiles = [...currentFiles, ...droppedFiles].slice(0, 5);

    const dataTransfer = new DataTransfer();
    combinedFiles.forEach(file => dataTransfer.items.add(file));
    inputFile.files = dataTransfer.files;

    updateFileInfoDisplay();
  });

  inputFile.addEventListener("change", updateFileInfoDisplay);

  // === 🚀 Upload form submission logic ===
  musicForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const files = inputFile.files;
    if (!files || files.length === 0) {
      uploadStatus.textContent = "Please select at least one file.";
      return;
    }

    if (files.length > 5) {
      uploadStatus.textContent = "Please select 5 or fewer files.";
      return;
    }

    const artistName = document.getElementById("artistName").value;
    const email = document.getElementById("email").value;

    if (!artistName || !email) {
      uploadStatus.textContent = "Please fill in all required fields.";
      return;
    }

    uploadStatus.innerHTML = "";
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileIndex = i + 1;
      const totalFiles = files.length;
      const statusLine = document.createElement("div");
      statusLine.textContent = `${fileIndex}/${totalFiles} Starting upload...`;
      uploadStatus.appendChild(statusLine);

      try {
        await uploadSingleFile(file, artistName, email, (percent) => {
          statusLine.textContent = `${fileIndex}/${totalFiles} Uploading... ${percent}%`;
        });

        statusLine.textContent = `${fileIndex}/${totalFiles} Upload complete`;
        successCount++;
      } catch (error) {
        console.error("Upload failed:", error);
        statusLine.textContent = `${fileIndex}/${totalFiles} Upload failed`;
      }
    }

    if (successCount === files.length) {
      uploadStatus.innerHTML += `<div>All ${successCount} uploads completed successfully.</div>`;
    } else {
      uploadStatus.innerHTML += `<div>${successCount}/${files.length} uploads completed.</div>`;
    }
  });

  // === 📦 Upload a single file ===
  async function uploadSingleFile(file, artistName, email, onProgress) {
    const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB
    const dropboxPath = `/submissions/${artistName}_${Date.now()}_${file.name}`;

    if (file.size <= 100 * 1024 * 1024) {
      // === Direct upload for files <= 100MB ===
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dropboxPath", dropboxPath);

      const directRes = await fetch("/api/appendUpload", {
        method: "POST",
        body: formData,
      });

      const json = await directRes.json();
      if (!directRes.ok || !json.success) {
        throw new Error(json.error || "Direct upload failed");
      }

      if (onProgress) onProgress(100); // instantly complete
    } else {
      // === Chunked upload for files > 100MB ===
      const startRes = await fetch("/api/startUpload", { method: "POST" });
      const { session_id } = await startRes.json();

      if (!session_id) throw new Error("Failed to start upload session");

      let offset = 0;
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + CHUNK_SIZE);

        const appendRes = await fetch("/api/appendUpload", {
          method: "POST",
          headers: {
            "x-dropbox-session-id": session_id,
            "x-dropbox-offset": offset.toString()
          },
          body: chunk
        });

        if (!appendRes.ok) {
          const errText = await appendRes.text();
          throw new Error(`Append failed: ${errText}`);
        }

        offset += chunk.size;
        const percent = Math.min(Math.floor((offset / file.size) * 100), 100);
        if (onProgress) onProgress(percent);
      }

      const finishRes = await fetch("/api/finishUpload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, offset, dropboxPath })
      });

      const finishData = await finishRes.json();

      if (!finishRes.ok || !finishData.success) {
        throw new Error(finishData.error || "Failed to finish upload");
      }
    }
  }
});
