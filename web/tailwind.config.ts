import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#16243f", deep: "#0d1526", panel: "#111c33" },
        gold: { DEFAULT: "#c9a23a", soft: "#f6ecca", dark: "#3a2f0e", ink: "#7a5f0c" },
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
