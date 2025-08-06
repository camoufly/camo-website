console.log("✅ Script loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");

  const musicForm = document.getElementById("musicForm");
  console.log("✅ musicForm:", musicForm);

  if (musicForm) {
    musicForm.addEventListener("submit", function (e) {
      console.log("✅ Form submitted");
      e.preventDefault();

      // TEMP: Show message to ensure feedback
      const uploadStatus = document.getElementById("uploadStatus");
      if (uploadStatus) {
        uploadStatus.textContent = "🔄 Form submitted successfully (test)";
      }
    });
  } else {
    console.log("❌ musicForm not found");
  }
});
