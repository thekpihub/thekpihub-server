import type { Theme } from "@/types";

const THEME_KEY = "wingcommander-theme";

export function getStoredTheme(): Theme {
  try {
    return (localStorage.getItem(THEME_KEY) as Theme) ?? "system";
  } catch {
    return "system";
  }
}

export function setStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.remove("dark", "light");
  root.classList.add(isDark ? "dark" : "light");
}

export function getEffectiveTheme(theme: Theme): "dark" | "light" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}
