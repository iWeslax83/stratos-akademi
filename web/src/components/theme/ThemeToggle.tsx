"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Tema değiştir"
      className="grid h-9 w-9 place-items-center rounded-full bg-black/5 text-navy hover:bg-black/10 dark:bg-white/10 dark:text-white"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
