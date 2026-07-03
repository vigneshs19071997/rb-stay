import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palm-shade green — restful, the brand's anchor
        palm: {
          50: "#eef4f1",
          100: "#d6e5dd",
          600: "#1c5345",
          700: "#143f35",
          800: "#0e3b33",
          900: "#0a2c26",
        },
        // Marigold brass — the festive South-Indian accent
        marigold: {
          400: "#e0ad53",
          500: "#d89b3a",
          600: "#c5862a",
        },
        // Jasmine — warm off-white surfaces
        jasmine: {
          50: "#fdfbf6",
          100: "#fbf7f0",
          200: "#f3ece0",
        },
        ink: "#12231f",
        sage: "#e7ebe3",
      },
      fontFamily: {
        display: ["Marcellus", "Georgia", "serif"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 40px -22px rgba(14, 59, 51, 0.35)",
        card: "0 1px 2px rgba(18,35,31,0.04), 0 12px 30px -18px rgba(18,35,31,0.25)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.2s ease-out both",
        "slide-in": "slide-in 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
