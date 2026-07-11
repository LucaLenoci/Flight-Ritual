"use client";

import { Moon, Sun } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "aloft-theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    setTheme(stored === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="flex h-9 w-9 items-center justify-center rounded-pill border border-border text-text-secondary transition-all duration-ui ease-standard hover:brightness-[1.06] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
    >
      {theme === "light" ? <Moon aria-hidden="true" /> : <Sun weight="fill" aria-hidden="true" />}
    </button>
  );
}

/** Inline, run before paint, so a stored dark preference never flashes light first. Light stays the true default. */
export const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("${STORAGE_KEY}");
    if (stored === "dark") document.documentElement.setAttribute("data-theme", "dark");
  } catch (e) {}
})();
`;
