/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./artikel/**/*.{html,js}",
    "./ext/**/*.{html,js}",
  ],

  darkMode: "media",

  corePlugins: {
    preflight: false, // ❌ jangan reset CSS global kamu
  },

  theme: {
    extend: {},
  },

  plugins: [],
};
