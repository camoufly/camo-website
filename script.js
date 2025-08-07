console.log("✅ Script loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");

  const musicForm = document.getElementById("musicForm");
  console.log("✅ musicForm:", musicForm);

  if (musicForm) {
    musicForm.addEventListener("submit", function (e) {
      e.preventDefault();
      console.log("✅ Form submitted");
    });
  } else {
    console.log("❌ musicForm not found");
  }
});
