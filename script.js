console.log("✅ Script loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");

  const form = document.getElementById("musicForm");
  const inputFile = document.getElementById("input-file");
  const uploadStatus = document.getElementById("uploadStatus");
  const dropArea = document.getElementById("drop-area");
  const imgView = document.getElementById("img-view");
  const MAX_FILES = 5;

  if (!form || !inputFile || !uploadStatus) {
    console.error("Missing form or inputs.");
    return;
  }

  console.log("✅ musicForm:", form.style.display);

  // Drag & Drop setup
  if (dropArea && imgView) {
    dropArea.addEventListener("click", () => inputFile.click());

    dropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropArea.classList.add("active");
    });

    dropArea.addEventListener("dragleave", () => {
      dropArea.classList.remove("active");
    });

    dropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      dropArea.classList.remove("active");

      const files = e.dataTransfer.files;
      if (files.length > MAX_FILES) {
        uploadStatus.textContent = "Please select 5 or fewer files.";
        return;
      }

      inputFile.files = files;

      imgView.innerHTML = `
        <img src="/your-icon.png" />
        <span>${files.length} file${files.length > 1 ? "s" : ""} selected</span>
      `;
    });

    inputFile.addEventListener("change", () => {
      if (inputFile.files.length > MAX_FILES) {
        uploadStatus.textContent = "Please select 5 or fewer files.";
        return;
      }

      imgView.innerHTML = `
        <img src="/your-icon.png" />
        <span>${inputFile.files.length} file${inputFile.files.length > 1 ? "s" : ""} selected</span>
      `;
    });
  }

  // Upload logic
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const files = inputFile.files;
    if (!files.length) {
      uploadStatus.textContent = "No file selected.";
      return;
    }

    if (files.length > MAX_FILES) {
      uploadStatus.textContent = "Please select 5 or fewer files.";
      return;
    }

    uploadStatus.textContent = "";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploadStatus.textContent = `${i + 1}/${files.length} Uploading... 0%`;

      try {
        await uploadSingleFile(file, (percent) => {
          uploadStatus.textContent = `${i + 1}/${files.length} Uploading... ${percent}%`;
        });
      } catch (err) {
        console.error("Upload failed:", err);
        uploadStatus.textContent = `Error uploading "${file.name}": ${err.message}`;
        return;
      }
    }

    uploadStatus.textContent = "All uploads completed successfully.";
  });

  // Upload file with chunked support
  async function uploadSingleFile(file, onProgress) {
    const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB
    const isLarge = file.size > CHUNK_SIZE;
    const dropboxPath = `/uploads/${Date.now()}-${file.name}`;

    if (!isLarge) {
      // Small file — direct upload
      const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DROPBOX_PERMANENT_TOKEN}`, // Not exposed here! Should use server function
          "Dropbox-API-Arg": JSON.stringify({
            path: dropboxPath,
            mode: "add",
            autorename: true,
            mute: false
          }),
          "Content-Type": "application/octet-stream"
        },
        body: file
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Dropbox upload failed: ${errorText}`);
      }

      onProgress(100);
      return;
    }

    // Large file — chunked upload
    const startRes = await fetch("/api/startUpload", {
      method: "POST"
    });

    const { session_id } = await startRes.json();
    if (!session_id) throw new Error("Failed to start upload session");

    let offset = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const chunkArrayBuffer = await chunk.arrayBuffer();

      const res = await fetch("/api/appendUpload", {
        method: "POST",
        headers: {
          "x-dropbox-session-id": session_id,
          "x-dropbox-offset": offset
        },
        body: chunkArrayBuffer
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Chunk append failed: ${errText}`);
      }

      offset += chunk.size;
      const percent = Math.floor((offset / file.size) * 100);
      onProgress(percent);
    }

    // Finish upload
    const finishRes = await fetch("/api/finishUpload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id,
        offset,
        dropboxPath
      })
    });

    if (!finishRes.ok) {
      const errText = await finishRes.text();
      throw new Error(`Finish upload failed: ${errText}`);
    }

    onProgress(100);
  }
});
