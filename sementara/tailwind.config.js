/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.{html,js}",
    "./src/**/*.{html,js}",
    "./components/**/*.{html,js}",
  ],
  darkMode: "media",

  // ❌ Matikan preflight agar CSS kamu tetap utuh
  corePlugins: {
    preflight: false,
  },

  theme: {
    extend: {},
  },
  plugins: [],
};
