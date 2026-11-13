(() => {
  const key = "student-portal-theme";

  const paint = (dark) => {
    document.body.classList.toggle("dark", dark);
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      button.textContent = dark ? "☀️ Light theme" : "🌙 Dark theme";
      button.setAttribute("aria-pressed", String(dark));
    });
  };

  paint(localStorage.getItem(key) === "dark");

  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const dark = !document.body.classList.contains("dark");
      localStorage.setItem(key, dark ? "dark" : "light");
      paint(dark);
    });
  });
})();