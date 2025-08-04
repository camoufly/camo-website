document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM loaded, script running...");

  /* =========================
     Button click animation
  ========================= */
  const animateButton = (t) => {
    t.preventDefault();
    t.target.classList.remove("animate");
    t.target.classList.add("animate");
    setTimeout(() => t.target.classList.remove("animate"), 700);
  };

  const buttons = document.getElementsByClassName("button");
  console.log(`🎛 Found buttons: ${buttons.length}`);
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", animateButton, false);
  }

  /* =========================
     Mailing list subscription
  ========================= */
  window.addToMailingList = function () {
    const mail = document.getElementById("mailbox_input")?.value;
    if (mail && mail.trim() !== "") {
      const t = new XMLHttpRequest();
      t.open(
        "POST",
        "https://camoufly-mailing-list.z8.re/add_to_mailing_list?email=" + mail
      );
      t.onload = function () {
        if (t.status == 200) {
          document.getElementsByClassName("button")[0].innerHTML = "Success!";
        } else if (t.status == 400) {
          document.getElementsByClassName("button")[0].innerHTML =
            "An Error occurred!";
        }
      };
      t.send();
    }
  };

  /* =========================
     Music upload form (.hero drag & drop)
  ========================= */
  const fileInput = document.getElementById("input-file");
  const dropArea = document.getElementById("drop-area");

  if (!fileInput || !dropArea) {
    console.warn("⚠ Upload elements not found");
    return;
  }
  console.log("🎯 Found upload elements");

  // Create or find upload status element
  let uploadStatus = document.getElementById("uploadStatus");
  if (!uploadStatus) {
    uploadStatus = document.createElement("div");
    uploadStatus.id = "uploadStatus";
    uploadStatus.style.marginTop = "10px";
    uploadStatus.style.fontSize = "14px";
    uploadStatus.style.color = "#333";
    dropArea.parentNode.appendChild(uploadStatus);
  }

  // Drag over highlight
  dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("active");
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("active");
  });

  // Handle file drop
  dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("active");
    fileInput.files = e.dataTransfer.files;
    console.log("📦 File dropped:", fileInput.files[0]?.name);
    handleFileUpload(fileInput.files[0]);
  });

  // Handle file picker change (triggered by label click)
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      console.log("📂 File selected:", fileInput.files[0].name);
      handleFileUpload(fileInput.files[0]);
    }
  });

  // Main upload function
  async function handleFileUpload(file) {
    if (!file) {
      uploadStatus.textContent = "⚠ Please select a file.";
      return;
    }

    uploadStatus.textContent = `Selected: ${file.name} — preparing upload…`;
    console.log("⏳ Preparing upload for:", file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64File = reader.result.split(",")[1];
      console.log("📏 Base64 file length:", base64File.length);

      try {
        uploadStatus.textContent = "⏳ Uploading…";
        console.log("🚀 Sending request to /api/upload…");

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Anonymous",
            email: "",
            message: "",
            fileName: file.name,
            fileData: base64File
          }),
        });

        const data = await res.json();
        console.log("✅ Response from server:", data);

        if (data.success) {
          uploadStatus.textContent = "✅ Upload successful!";
        } else {
          uploadStatus.textContent =
            "❌ Upload failed: " + (data.error || "Unknown error");
        }
      } catch (err) {
        console.error("❌ Upload error:", err);
        uploadStatus.textContent = "❌ Upload failed: " + err.message;
      }
    };

    reader.readAsDataURL(file);
  }
});
