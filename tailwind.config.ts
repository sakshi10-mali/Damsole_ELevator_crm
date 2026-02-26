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
        /* Logo brand: dark blue (Damsole text) + red (arrow accent) */
        primary: {
          50: "#eef2f9",
          100: "#dbe3f2",
          200: "#b8c7e5",
          300: "#8fa3d4",
          400: "#647dbf",
          500: "#1e3a6e",
          600: "#0c1e3c",
          700: "#0a1730",
          800: "#071028",
          900: "#050d20",
        },
        accent: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#e03c3c",
          600: "#c41e2a",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
      },
    },
  },
  plugins: [],
};
export default config;






















