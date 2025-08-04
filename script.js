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
  const uploadStatus = document.getElementById("uploadStatus");

  musicForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate inputs
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

    // Validate file type and size
    const file = fileInput.files[0];
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/flac"];
    if (!allowedTypes.includes(file.type)) {
      uploadStatus.textContent = "⚠ Only mp3, wav, and flac files are allowed.";
      return;
    }
    const maxSizeMB = 50;
    if (file.size > maxSizeMB * 1024 * 1024) {
      uploadStatus.textContent = `⚠ File must be smaller than ${maxSizeMB}MB.`;
      return;
    }

    uploadStatus.textContent = "⏳ Preparing upload...";

    const reader = new FileReader();

    reader.onload = async () => {
      const base64File = reader.result.split(",")[1];

      uploadStatus.textContent = "⏳ Uploading...";

      try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbwEFBHMf9K3lIeaVqXAO_Cxub_hOcoz5ix13Ac7uegIkf4rxkWSj3Mx55gUqqZ3plpf/exec", {
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

        const data = await response.json();

        if (data.success) {
          uploadStatus.textContent = "✅ Upload successful!";
          musicForm.reset();
          setTimeout(() => {
            uploadStatus.textContent = "";
          }, 5000);
        } else {
          uploadStatus.textContent = `❌ Upload failed: ${data.error || "Unknown error"}`;
        }
      } catch (err) {
        uploadStatus.textContent = `❌ Upload failed: ${err.message}`;
      }
    };

    reader.onerror = () => {
      uploadStatus.textContent = "❌ Error reading file.";
    };

    reader.readAsDataURL(file);
  });
});
