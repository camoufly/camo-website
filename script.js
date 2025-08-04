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

  // Create a hidden iframe to handle form submission response
  const iframe = document.createElement("iframe");
  iframe.name = "upload_iframe";
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  musicForm.addEventListener("submit", (e) => {
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

    reader.onload = () => {
      const base64File = reader.result.split(",")[1];

      // Add hidden inputs for base64 data and filename
      let base64Input = musicForm.querySelector("input[name='fileData']");
      if (!base64Input) {
        base64Input = document.createElement("input");
        base64Input.type = "hidden";
        base64Input.name = "fileData";
        musicForm.appendChild(base64Input);
      }
      base64Input.value = base64File;

      let fileNameInput = musicForm.querySelector("input[name='fileName']");
      if (!fileNameInput) {
        fileNameInput = document.createElement("input");
        fileNameInput.type = "hidden";
        fileNameInput.name = "fileName";
        musicForm.appendChild(fileNameInput);
      }
      fileNameInput.value = file.name;

      // Set form attributes to submit to Google Apps Script via iframe
      musicForm.target = "upload_iframe";
      musicForm.action = "https://script.google.com/macros/s/AKfycbwEFBHMf9K3lIeaVqXAO_Cxub_hOcoz5ix13Ac7uegIkf4rxkWSj3Mx55gUqqZ3plpf/exec";
      musicForm.method = "POST";

      uploadStatus.textContent = "⏳ Uploading...";

      // Listen for iframe load event to catch response
      iframe.onload = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const responseText = iframeDoc.body.innerText || iframeDoc.body.textContent;
          const data = JSON.parse(responseText);
          if (data.success) {
            uploadStatus.textContent = "✅ Upload successful!";
            musicForm.reset();
            base64Input.remove();
            fileNameInput.remove();
            setTimeout(() => {
              uploadStatus.textContent = "";
            }, 5000);
          } else {
            uploadStatus.textContent = `❌ Upload failed: ${data.error || "Unknown error"}`;
          }
        } catch (err) {
          uploadStatus.textContent = "❌ Upload failed: Could not parse server response.";
        }
      };

      musicForm.submit();
    };

    reader.onerror = () => {
      uploadStatus.textContent = "❌ Error reading file.";
    };

    reader.readAsDataURL(file);
  });
});

    reader.readAsDataURL(file);
  });
});
