document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     Button click animation
  ========================= */
  var animateButton = function (t) {
    t.preventDefault();
    t.target.classList.remove("animate");
    t.target.classList.add("animate");
    setTimeout(function () {
      t.target.classList.remove("animate");
    }, 700);
  };

  var buttons = document.getElementsByClassName("button");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", animateButton, false);
  }

  /* =========================
     Mailing list subscription
  ========================= */
  window.addToMailingList = function () {
    var mail = document.getElementById("mailbox_input")?.value;
    if (mail && mail.trim() !== "") {
      var t = new XMLHttpRequest();
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
  const musicForm = document.getElementById("musicForm");
  const fileInput = document.getElementById("input-file");
  const dropArea = document.getElementById("drop-area");
  const uploadStatus = document.getElementById("uploadStatus");

  if (dropArea && fileInput) {
    // Click to open file picker
    dropArea.addEventListener("click", () => {
      console.log("Drop area clicked");
      fileInput.click();
    });

    // Highlight drop area when dragging file
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
      fileInput.files = e.dataTransfer.files;
    });
  }

  if (musicForm) {
    musicForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const file = fileInput.files[0];
      if (!file) {
        if (uploadStatus) uploadStatus.textContent = "⚠ Please select a file.";
        return;
      }

      // Show uploading message
      if (uploadStatus) uploadStatus.textContent = "⏳ Uploading…";

      const reader = new FileReader();
      reader.onload = async () => {
        const base64File = reader.result.split(",")[1]; // remove data: prefix

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Anonymous", // Replace with real inputs if needed
              email: "",
              message: "",
              fileName: file.name,
              fileData: base64File
            }),
          });

          const data = await res.json();
          if (uploadStatus) {
            if (data.success) {
              uploadStatus.textContent = "✅ Upload successful!";
            } else {
              uploadStatus.textContent = "❌ Upload failed: " + (data.error || "Unknown error");
            }
          }
        } catch (err) {
          if (uploadStatus) uploadStatus.textContent = "❌ Upload failed: " + err.message;
        }
      };

      reader.readAsDataURL(file);
    });
  }

});
