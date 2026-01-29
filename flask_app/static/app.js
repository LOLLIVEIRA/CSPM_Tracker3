(function () {
  const root = document.documentElement;
  const toggleButton = document.getElementById("dark-mode-toggle");
  const stored = localStorage.getItem("theme");

  if (stored === "dark") {
    root.classList.add("dark");
  }

  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      root.classList.toggle("dark");
      localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
      refreshLucide();
    });
  }

  function refreshLucide() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  refreshLucide();
})();
