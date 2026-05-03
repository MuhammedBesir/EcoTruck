/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F6E56",
          light: "#1D9E75",
          dark: "#0a4f3d",
        },
        eco: {
          bg: "#F0FDF4",
          green: "#0F6E56",
          danger: "#DC2626",
          warning: "#D97706",
        },
      },
    },
  },
  plugins: [],
};
