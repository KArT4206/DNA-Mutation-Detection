/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",   // 👈 important (not false)
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
