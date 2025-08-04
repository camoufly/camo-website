document.addEventListener("DOMContentLoaded", () => {
  const musicForm = document.getElementById("musicForm");
  const fileInput = document.getElementById("input-file");
  const dropArea = document.getElementById("drop-area");
  const uploadStatus = document.getElementById("uploadStatus");

  // Drag & drop handlers
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
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      uploadStatus.textContent = `Selected file: ${fileInput.files[0].name}`;
    }
  });

  // Prevent upload on file select; just update message
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      uploadStatus.textContent = `Selected file: ${fileInput.files[0].name}`;
    }
  });

  musicForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate fields manually (to support better message UI)
    if (!fileInput.files[0]) {
      uploadStatus.textContent = "⚠ Please select a file.";
      return;
    }
    if (!musicForm.artistName.value.trim()) {
      uploadStatus.textContent = "⚠ Please enter your artist name.";
      return;
    }
    if (!musicForm.songTitle.value.trim()) {
      uploadStatus.textContent = "⚠ Please enter the song title.";
      return;
    }
    if (!musicForm.email.value.trim()) {
      uploadStatus.textContent = "⚠ Please enter your email.";
      return;
    }

    uploadStatus.textContent = "⏳ Preparing upload...";

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      const base64File = reader.result.split(",")[1];

      uploadStatus.textContent = "⏳ Uploading...";

      try {
        const res = await fetch("https://camo-website.vercel.app/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            artistName: musicForm.artistName.value.trim(),
            songTitle: musicForm.songTitle.value.trim(),
            email: musicForm.email.value.trim(),
            fileName: file.name,
            fileData: base64File,
          }),
        });

        const data = await res.json();

        if (data.success) {
          uploadStatus.textContent = "✅ Upload successful!";
          musicForm.reset();
        } else {
          uploadStatus.textContent = `❌ Upload failed: ${data.error || "Unknown error"}`;
        }
      } catch (err) {
        uploadStatus.textContent = `❌ Upload failed: ${err.message}`;
      }
    };

    reader.readAsDataURL(file);
  });
});
