import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Amblemden türetilmiş palet: lacivert gövde + tek turkuaz aksan.
        // logo.svg iki renk kullanır — #05080F zemin, #4FB3BF delta.
        navy: { DEFAULT: "#0e1a2e", deep: "#05080f", panel: "#0e1826" },
        // DEFAULT doğrudan amblemin turkuazı. ink → açık temada AA metin
        // kontrastı için koyultulmuş; soft/dark → çip zeminleri.
        accent: { DEFAULT: "#4fb3bf", soft: "#dcf0f2", dark: "#0c2f35", ink: "#0b5a64" },
        ink: "#0f1a30",
        muted: "#64708a",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
      },
      borderRadius: { bezel: "26px", core: "20px" },
    },
  },
  plugins: [],
} satisfies Config;
