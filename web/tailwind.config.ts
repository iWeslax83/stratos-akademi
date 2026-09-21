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
        // Açık/koyu değerler globals.css'te; kanal biçimi text-muted/60 gibi opaklıkları korur.
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
        // Anlamsal renkler (globals.css değişkenleri; .dark ile otomatik döner).
        fg: { DEFAULT: "var(--fg)", soft: "var(--fg-soft)" },
        tint: { DEFAULT: "var(--tint)", hover: "var(--tint-hover)" },
        track: "var(--track)",
        "accent-fg": "var(--accent-fg)",
        "accent-wash": "var(--accent-wash)",
        "danger-fg": "var(--danger-fg)",
        "danger-wash": { DEFAULT: "var(--danger-wash)", hover: "var(--danger-wash-hover)" },
        "success-fg": "var(--success-fg)",
        "warn-fg": "var(--warn-fg)",
      },
      // Ölçek: xs 12, 2sm 13, sm 14, base 16, lg 18 ... 12px altı yok.
      fontSize: { "2sm": ["0.8125rem", { lineHeight: "1.25rem" }] },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
      },
      borderRadius: { bezel: "26px", core: "20px" },
    },
  },
  plugins: [],
} satisfies Config;
