console.log("✅ Script loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");

  const musicForm = document.getElementById("musicForm");
  const inputFile = document.getElementById("input-file");
  const uploadStatus = document.getElementById("uploadStatus");

  if (!musicForm || !inputFile || !uploadStatus) {
    console.error("❌ Missing form, input or status element");
    return;
  }

  musicForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const files = inputFile.files;
    if (!files || files.length === 0) {
      uploadStatus.textContent = "❌ Please select at least one file.";
      return;
    }

    if (files.length > 5) {
      uploadStatus.textContent = "❌ Please select 5 or fewer files.";
      return;
    }

    const artistName = document.getElementById("artistName").value;
    const email = document.getElementById("email").value;

    if (!artistName || !email) {
      uploadStatus.textContent = "❌ Please fill in all required fields.";
      return;
    }

    uploadStatus.innerHTML = "";
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileCount = `${i + 1}/${files.length}`;
      const statusLine = document.createElement("div");
      statusLine.textContent = `${fileCount} Starting upload...`;
      uploadStatus.appendChild(statusLine);

      try {
        await uploadSingleFile(file, artistName, email, (percent) => {
          statusLine.textContent = `${fileCount} Uploading... ${percent}%`;
        });

        statusLine.textContent = `${fileCount} ✅ Upload complete`;
        successCount++;
      } catch (error) {
        console.error("Upload failed:", error);
        statusLine.textContent = `${fileCount} ❌ Upload failed`;
      }
    }

    if (successCount === files.length) {
      uploadStatus.innerHTML += `<div>✅ All ${successCount} uploads completed successfully.</div>`;
    } else {
      uploadStatus.innerHTML += `<div>⚠️ ${successCount}/${files.length} uploads completed.</div>`;
    }
  });

  async function uploadSingleFile(file, artistName, email, onProgress) {
    const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    const startRes = await fetch("/api/startUpload", { method: "POST" });
    const { session_id } = await startRes.json();

    if (!session_id) throw new Error("Failed to start upload session");

    let offset = 0;
    let chunkIndex = 0;

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
      chunkIndex++;

      const percent = Math.min(Math.floor((offset / file.size) * 100), 100);
      if (onProgress) onProgress(percent);
    }

    const dropboxPath = `/submissions/${artistName}_${Date.now()}_${file.name}`;

    const finishRes = await fetch("/api/finishUpload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id, offset, dropboxPath })
    });

    const finishData = await finishRes.json();

    if (!finishRes.ok || !finishData.success) {
      throw new Error(finishData.error || "Failed to finish upload");
    }

    // Optionally: Send artist/email metadata to your own backend if needed
  }
});
