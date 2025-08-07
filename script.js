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
     Music Upload to Dropbox (via Vercel)
  ========================= */
  const musicForm = document.getElementById("musicForm");
  const artistNameInput = document.getElementById("artistName");
  const emailInput = document.getElementById("email");

  async function uploadSingleFile(file, index, totalFiles) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("artist", artistNameInput.value.trim());
    formData.append("email", emailInput.value.trim());

    uploadStatus.textContent = `📤 [${index + 1}/${totalFiles}] Uploading...`;

    const res = await fetch("/api/uploadFile", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) {
      uploadStatus.textContent = `❌ [${index + 1}/${totalFiles}] Failed: ${result.error || "Upload failed"}`;
    } else {
      uploadStatus.textContent = `✅ [${index + 1}/${totalFiles}] Finished: ${file.name}`;
    }
  }

  if (musicForm) {
    musicForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!fileInput.files.length) {
        uploadStatus.textContent = "⚠️ Please select a file.";
        return;
      }
      if (fileInput.files.length > 5) {
        uploadStatus.textContent = "⚠️ You can upload a maximum of 5 files.";
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
  }
});
