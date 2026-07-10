import type { Config } from "tailwindcss";

// Aviation-inspired design tokens: deep night-sky ink, runway gold accent,
// altitude blue for data/trust, and a restrained neutral scale for chrome.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05070d",
          900: "#0b0f1a",
          800: "#121729",
          700: "#1b2238",
          600: "#2a3352",
        },
        altitude: {
          400: "#7dd3ff",
          500: "#3fa9f5",
          600: "#1c7ed6",
        },
        runway: {
          400: "#f6c667",
          500: "#e8a93a",
          600: "#c98a1f",
        },
        mist: {
          100: "#f5f7fb",
          200: "#e4e8f1",
          300: "#c7cede",
          400: "#9aa4bd",
        },
        signal: {
          success: "#3ecf8e",
          warning: "#f2b544",
          danger: "#f0576b",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(63, 169, 245, 0.35)",
        "runway-glow": "0 0 60px -10px rgba(232, 169, 58, 0.45)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
