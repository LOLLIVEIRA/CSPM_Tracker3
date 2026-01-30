(function () {
  const root = document.documentElement;
  const toggleButton = document.getElementById("dark-mode-toggle");
  const stored = localStorage.getItem("theme");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (stored === "dark" || (!stored && prefersDark)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      root.classList.toggle("dark");
      localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
      updateToggle();
    });
  }

  function updateToggle() {
    const isDark = root.classList.contains("dark");
    if (toggleButton) {
      toggleButton.innerHTML = `<i data-lucide="${isDark ? "sun" : "moon"}" class="w-5 h-5"></i>`;
      toggleButton.setAttribute(
        "aria-label",
        isDark ? "Mudar para modo claro" : "Mudar para modo escuro"
      );
    }
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  updateToggle();
})();
