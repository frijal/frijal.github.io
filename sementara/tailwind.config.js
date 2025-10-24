/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.{html,js,jsx,ts,tsx,vue,svelte,astro,md,mdx}",
    "./src/**/*.{html,js,jsx,ts,tsx,vue,svelte,astro,md,mdx}",
    "./components/**/*.{html,js,jsx,ts,tsx,vue,svelte}",
    "./pages/**/*.{html,js,jsx,ts,tsx,vue,svelte,html}",
    "./public/**/*.html",
  ],

  // 🌗 Mode gelap otomatis mengikuti sistem
  darkMode: "media",

  // 🧱 Matikan preflight agar Tailwind tidak menyentuh gaya bawaan browser (termasuk SVG)
  corePlugins: {
    preflight: false,
  },

  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },

    extend: {
      // 🎨 Warna adaptif menggunakan CSS Variable (aman & ringan)
      colors: {
        background: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
      },

      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Fira Code", "ui-monospace", "monospace"],
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },

      boxShadow: {
        soft: "0 2px 10px rgba(0,0,0,0.08)",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out",
      },
    },
  },

  plugins: [], // Tidak pakai plugin agar aman dan ringan
};
