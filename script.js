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
     Music Upload Direct to Dropbox
  ========================= */
  const musicForm = document.getElementById("musicForm");
  if (musicForm) {
    musicForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const fileInput = document.getElementById("input-file");
      const artistName = document.getElementById("artistName").value.trim();
      const songTitle = document.getElementById("songTitle").value.trim();
      const email = document.getElementById("email").value.trim();
      const uploadStatus = document.getElementById("uploadStatus");

      if (!fileInput.files.length) {
        uploadStatus.textContent = "⚠️ Please select a file.";
        return;
      }

      const file = fileInput.files[0];
      const dropboxPath = `/MusicUploads/${artistName} - ${songTitle} (${email}) - ${file.name}`;

      try {
        // 1️⃣ Get a short-lived token from Vercel
        uploadStatus.textContent = "Requesting upload permission...";
        const tokenRes = await fetch("/api/getToken");
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(tokenData.error || "Token request failed");
        const shortLivedToken = tokenData.token;

        // 2️⃣ Upload directly to Dropbox
        uploadStatus.textContent = "⏳ Uploading to Dropbox...";
        const uploadRes = await fetch("https://content.dropboxapi.com/2/files/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${shortLivedToken}`,
            "Dropbox-API-Arg": JSON.stringify({
              path: dropboxPath,
              mode: "add",
              autorename: true,
              mute: false
            }),
            "Content-Type": "application/octet-stream"
          },
          body: file
        });

        if (uploadRes.ok) {
          uploadStatus.textContent = "✅ Upload successful!";
          fileInput.value = "";
          document.getElementById("artistName").value = "";
          document.getElementById("songTitle").value = "";
          document.getElementById("email").value = "";
        } else {
          const err = await uploadRes.json();
          uploadStatus.textContent = `❌ Upload failed: ${err.error_summary || "Unknown error"}`;
        }
      } catch (error) {
        console.error(error);
        uploadStatus.textContent = "❌ Error uploading file.";
      }
    });
  }
});
