document.addEventListener("DOMContentLoaded", () => {
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("input-file");
  const uploadStatus = document.getElementById("uploadStatus");
  const musicForm = document.getElementById("musicForm");
  const artistNameInput = document.getElementById("artistName");
  const emailInput = document.getElementById("email");

  /* ===== Button Animation ===== */
  const animateButton = (e) => {
    e.preventDefault();
    e.target.classList.remove("animate");
    e.target.classList.add("animate");
    setTimeout(() => e.target.classList.remove("animate"), 700);
  };
  document.querySelectorAll(".button").forEach(btn =>
    btn.addEventListener("click", animateButton)
  );

  /* ===== Drag & Drop ===== */
  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });
  ["dragenter", "dragover"].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.add("active"));
  });
  ["dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.remove("active"));
  });
  dropArea.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  /* ===== File Selection ===== */
  fileInput?.addEventListener("change", () => {
    if (fileInput.files.length > 5) {
      uploadStatus.textContent = "⚠️ You can upload a maximum of 5 files.";
      fileInput.value = "";
      return;
    }

    const oversized = Array.from(fileInput.files).find(file => file.size > MAX_FILE_SIZE);
    if (oversized) {
      uploadStatus.textContent = `⚠️ ${oversized.name} is too big (max 100MB).`;
      fileInput.value = "";
      return;
    }

    if (fileInput.files.length > 0) {
      uploadStatus.textContent = `📁 ${fileInput.files.length} file(s) selected.`;
    } else {
      uploadStatus.textContent = "";
    }
  });

  /* ===== Upload Logic ===== */
  async function uploadFile(file, index, totalFiles) {
    const now = new Date();
    const dateFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const folderPath = `${dateFolder}`;
    const safeArtist = artistNameInput.value.trim().replace(/[^\w\s-]/g, "_");
    const safeEmail = emailInput.value.trim().replace(/[^\w\s@.-]/g, "_");
    const fileName = `${safeArtist} - ${file.name} (${safeEmail})`;
    const finalPath = `${folderPath}/${fileName}`;

    uploadStatus.textContent = `📤 [${index + 1}/${totalFiles}] Uploading: ${file.name}`;

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "filename": finalPath,
          "content-type": file.type || "application/octet-stream"
        },
        body: file
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Unknown error");

      uploadStatus.textContent = `✅ [${index + 1}/${totalFiles}] Uploaded: ${file.name}`;
    } catch (err) {
      uploadStatus.textContent = `❌ [${index + 1}/${totalFiles}] Failed: ${err.message}`;
    }
  }

  /* ===== Form Submit ===== */
  musicForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const files = Array.from(fileInput.files);
    if (!files.length) return uploadStatus.textContent = "⚠️ Please select at least one file.";
    if (!artistNameInput.value.trim() || !emailInput.value.trim()) {
      return uploadStatus.textContent = "⚠️ Please fill out all fields.";
    }

    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i], i, files.length);
    }

    uploadStatus.textContent += " 🎉 All done!";
    fileInput.value = "";
    artistNameInput.value = "";
    emailInput.value = "";
  });
});
