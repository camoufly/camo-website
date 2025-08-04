// =========================
// Button click animation
// =========================
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

// =========================
// Mailing list subscription
// =========================
function addToMailingList() {
  var mail = document.getElementById("mailbox_input").value;
  if (mail !== "" && mail !== null) {
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
}

// =========================
// Music upload form
// =========================
const musicForm = document.getElementById("musicForm");
if (musicForm) {
  musicForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.querySelector('input[name="track"]');
    const file = fileInput.files[0];
    if (!file) {
      alert("Please choose a file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64File = reader.result.split(",")[1]; // remove data: prefix

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: e.target.name.value,
            email: e.target.email.value,
            message: e.target.message.value,
            fileName: file.name,
            fileData: base64File,
          }),
        });

        const data = await res.json();
        alert(data.message || data.error);
      } catch (err) {
        alert("Upload failed: " + err.message);
      }
    };

// =========================
// Music upload form highlight
// =========================


const musicFormEl = document.getElementById("musicForm");
if (musicFormEl) {
  musicFormEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    musicFormEl.classList.add("dragover");
  });

  musicFormEl.addEventListener("dragleave", () => {
    musicFormEl.classList.remove("dragover");
  });

  musicFormEl.addEventListener("drop", () => {
    musicFormEl.classList.remove("dragover");
  });
}


    reader.readAsDataURL(file);
  });
}
