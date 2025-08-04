document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     Button click animation
  ========================= */
  const animateButton = function (e) {
    e.preventDefault();
    e.target.classList.remove("animate");
    e.target.classList.add("animate");
    setTimeout(() => {
      e.target.classList.remove("animate");
    }, 700);
  };
  const buttons = document.getElementsByClassName("button");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", animateButton, false);
  }

  /* =========================
     Music Upload to Dropbox (chunked)
  ========================= */
  const musicForm = document.getElementById("musicForm");
  const fileInput = document.getElementById("input-file");
  const artistNameInput = document.getElementById("artistName");
  const songTitleInput = document.getElementById("songTitle");
  const emailInput = document.getElementById("email");
  const uploadStatus = document.getElementById("uploadStatus");

  // Safe for Vercel Free plan (~4.5MB max body size)
  const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB

  fileInput?.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      uploadStatus.textContent = `📁 File selected: ${fileInput.files[0].name}`;
    } else {
      uploadStatus.textContent = "";
    }
  });

  if (musicForm) {
    musicForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      // Validate inputs
      if (!fileInput.files.length) {
        uploadStatus.textContent = "⚠️ Please select a file.";
        return;
      }
      if (!artistNameInput.value.trim() || !songTitleInput.value.trim() || !emailInput.value.trim()) {
        uploadStatus.textContent = "⚠️ Please fill out all fields.";
        return;
      }

      const file = fileInput.files[0];
      const dropboxPath = `/MusicUploads/${artistNameInput.value.trim()} - ${songTitleInput.value.trim()} (${emailInput.value.trim()}) - ${file.name}`;

      try {
        // 1️⃣ Start upload session
        uploadStatus.textContent = "⏳ Starting upload session...";
        const startRes = await fetch("/api/startUpload", { method: "POST" });
        const startData = await startRes.json();
        if (!startRes.ok || !startData.session_id) {
          throw new Error(startData.error || "Failed to start upload session");
        }
        const sessionId = startData.session_id;

        // 2️⃣ Upload chunks
        let offset = 0;
        let chunkIndex = 1;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        while (offset < file.size) {
          const chunk = file.slice(offset, offset + CHUNK_SIZE);
          uploadStatus.textContent = `⏳ Uploading chunk ${chunkIndex} of ${totalChunks}...`;

          const appendRes = await fetch("/api/appendUpload", {
            method: "POST",
            headers: {
              "x-dropbox-session-id": sessionId,
              "x-dropbox-offset": offset
            },
            body: chunk
          });

          if (appendRes.status === 413) {
            throw new Error(`Chunk too large for server: Reduce CHUNK_SIZE`);
          }
          if (!appendRes.ok) {
            throw new Error(`Failed to upload chunk ${chunkIndex}`);
          }

          offset += CHUNK_SIZE;
          chunkIndex++;
        }

        // 3️⃣ Finish upload
        uploadStatus.textContent = "⏳ Finalizing upload...";
        const finishRes = await fetch("/api/finishUpload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, offset: file.size, dropboxPath })
        });

        if (!finishRes.ok) {
          const errText = await finishRes.text();
          throw new Error(errText || "Failed to finish upload");
        }

        uploadStatus.textContent = "✅ Upload successful!";
        fileInput.value = "";
        artistNameInput.value = "";
        songTitleInput.value = "";
        emailInput.value = "";
      } catch (err) {
        console.error(err);
        uploadStatus.textContent = "❌ Upload failed: " + err.message;
      }
    });
  }
});
