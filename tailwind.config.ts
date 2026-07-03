import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        charcoal: "#242424",
        mine: "#3b3b3b",
        chicago: "#636363",
        dawn: "#a3a3a3",
        alto: "#cccccc",
        mercury: "#e1e1e1",
        smoke: "#f2f2f2",
        sand: "#e0d7d1",
        "highlight-light": "#f1e8dd",
        "highlight-medium": "#ceb18f",
        success: "#4a6741",
        "success-deep": "#3c4b37",
        "success-tint": "#d8e1d5",
        error: "#b42318",
        "error-tint": "#fbeeec",
        surface: "#fafafa",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Helvetica", "sans-serif"],
        display: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      fontSize: {
        /* Fluid display sizes — scale smoothly from 320px to 4K */
        "display-lg": ["clamp(2rem, 4vw + 0.5rem, 3.5rem)", { lineHeight: "1.1" }],
        "display-xl": ["clamp(2.5rem, 7vw, 7rem)", { lineHeight: "0.95" }],
        "display-2xl": ["clamp(1.75rem, 9.2vw, 10rem)", { lineHeight: "0.92" }],
      },
      letterSpacing: {
        widest: "0.2em",
        ultra: "0.3em",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        "m-sm": "12px",
        md: "16px",
        "m-lg": "20px",
        lg: "24px",
        xl: "32px",
        "2xl": "40px",
        "3xl": "48px",
        "4xl": "56px",
        "5xl": "64px",
        "9xl": "120px",
      },
      transitionDuration: {
        "400": "400ms",
      },
      boxShadow: {
        "level-1": "0 2px 6px 0 rgb(0 0 0 / 0.06), 0 4px 12px 0 rgb(35 41 54 / 0.08)",
        "level-2": "0 1px 4px 0 rgb(0 0 0 / 0.06), 0 8px 16px 0 rgb(35 41 54 / 0.08)",
        "level-3": "0 4px 8px 0 rgb(0 0 0 / 0.06), 0 12px 32px 0 rgb(35 41 54 / 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
