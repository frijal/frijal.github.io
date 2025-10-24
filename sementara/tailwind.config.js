/** @type {import('tailwindcss').Config} */
export default {
content: [
  "./**/*.html",
  "!./node_modules/**/*",  // ❌ Jangan pindai node_modules
  "./ext/**/*.js",
  "./sementara/**/*.js"
],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
    },
  },
  darkMode: "media", // otomatis mengikuti theme user (prefers-color-scheme)
  plugins: [],
};

