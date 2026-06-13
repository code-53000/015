/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        linen: {
          50: "#FDFBF7",
          100: "#FAF7F2",
          200: "#F2ECE0",
          300: "#E8DEC9",
          400: "#D9C9A8",
        },
        sienna: {
          50: "#F5EFE6",
          100: "#E8DAC4",
          200: "#D1B891",
          300: "#B39364",
          400: "#9A7A50",
          500: "#8B6F47",
          600: "#6F5737",
          700: "#57432A",
        },
        stitch: {
          50: "#F8E7E6",
          100: "#EFC7C4",
          200: "#E19B97",
          300: "#D1736D",
          400: "#C25B56",
          500: "#A74B47",
          600: "#873A37",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        "stitch-in": "inset 1px 1px 2px rgba(0,0,0,0.15), inset -1px -1px 2px rgba(255,255,255,0.3)",
        "paper": "0 1px 3px rgba(87,67,42,0.08), 0 4px 16px rgba(87,67,42,0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
