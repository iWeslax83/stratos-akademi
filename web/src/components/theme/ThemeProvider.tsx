"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";
type ThemeCtx = { theme: Theme; toggle: () => void };

const Ctx = createContext<ThemeCtx | null>(null);
const KEY = "stratos-theme";
const BG = { light: "#eef1f6", dark: "#05080f" } as const;

function systemTheme(): Theme {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  // Açık seçim adres çubuğu rengini de netleştirsin (media-tabanlı <meta>'yı ezer).
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = BG[theme];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // SSR "light" varsayar; layout'taki inline script .dark'ı zaten koydu, bu mount'ta senkronlanır.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    const resolved: Theme = saved === "dark" || saved === "light" ? saved : systemTheme();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(resolved);
    apply(resolved);

    // Kullanıcı açık bir seçim yapmadıysa OS tema değişimini canlı izle.
    if (saved !== "dark" && saved !== "light" && typeof window.matchMedia === "function") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        const next = mq.matches ? "dark" : "light";
        setTheme(next);
        apply(next);
      };
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      localStorage.setItem(KEY, next);
      apply(next);
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme, ThemeProvider içinde kullanılmalı");
  return ctx;
}
