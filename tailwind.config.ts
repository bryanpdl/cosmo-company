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
        background: "#16141A",
        cyan: {
          400: "#00ffff",
          500: "#00cccc",
        },
        purple: {
          500: "#bf00ff",
          600: "#9900cc",
        },
        green: {
          400: "#39ff14",
          500: "#2ecc11",
        },
      },
      animation: {
        "pulse-glow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
