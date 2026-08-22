const KEY = "scrape-kit-theme";
const DARK_COLOR = "#0f0f0f";
const LIGHT_COLOR = "#f4f4f4";

function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.getElementById("meta-theme-color");
  if (meta) meta.content = theme === "dark" ? DARK_COLOR : LIGHT_COLOR;
  try {
    localStorage.setItem(KEY, theme);
  } catch (e) {}
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  });
}

function toggleTheme() {
  applyTheme(currentTheme() === "dark" ? "light" : "dark");
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme(currentTheme());
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", toggleTheme);
  });
});
