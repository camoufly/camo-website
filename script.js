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
     Drag & Drop functionality
  ========================= */
  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("input-file");
  const uploadStatus = document.getElementById("uploadStatus");

  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropArea?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });

  ["dragenter", "dragover"].forEach(eventName => {
    dropArea?.addEventListener(eventName, () => dropArea.classList.add("active"));
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropArea?.addEventListener(eventName, () => dropArea.classList.remove("active"));
  });

  dropArea?.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  /* =========================
     File select update
  ========================= */
  fileInput?.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      if (fileInput.files.length > 5) {
        uploadStatus.textContent = "⚠️ You can upload a maximum of 5 files.";
        fileInput.value = "";
        return;
      }
      uploadStatus.textContent = `📁 ${fileInput.files.length} file(s) selected.`;
    } else {
      uploadStatus.textContent = "";
    }
  });

  /* =========================
     Firebase Music Upload
  ========================= */
  const musicForm = document.getElementById("musicForm");
  const artistNameInput = document.getElementById("artistName");
  const emailInput = document.getElementById("email");

  async function uploadFileToFirebase(file, index, totalFiles) {
    const now = new Date();
    const dateFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const folderPath = `MusicUploads/${dateFolder}`;
    const extension = file.name.split(".").pop();
    const fileName = `${artistNameInput.value.trim()} - ${file.name} (${emailInput.value.trim()}).${extension}`;
    const firebasePath = `${folderPath}/${fileName}`;

    try {
      uploadStatus.textContent = `📤 [${index + 1}/${totalFiles}] Uploading...`;

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "filename": firebasePath,
          "contentType": file.type
        },
        body: file
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Upload failed");

      uploadStatus.textContent = `✅ [${index + 1}/${totalFiles}] Uploaded: ${file.name}`;
    } catch (err) {
      uploadStatus.textContent = `❌ [${index + 1}/${totalFiles}] Failed: ${err.message}`;
    }
  }

  musicForm?.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!fileInput.files.length) {
      uploadStatus.textContent = "⚠️ Please select a file.";
      return;
    }

    if (!artistNameInput.value.trim() || !emailInput.value.trim()) {
      uploadStatus.textContent = "⚠️ Fill out all fields.";
      return;
    }

    const files = Array.from(fileInput.files);
    for (let i = 0; i < files.length; i++) {
      await uploadFileToFirebase(files[i], i, files.length);
    }

    uploadStatus.textContent += " 🎉 All uploads completed!";
    fileInput.value = "";
    artistNameInput.value = "";
    emailInput.value = "";
  });
});
