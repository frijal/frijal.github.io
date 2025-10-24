/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.{html,js,jsx,ts,tsx,vue,svelte,astro,md,mdx}",
    "./src/**/*.{html,js,jsx,ts,tsx,vue,svelte,astro,md,mdx}",
    "./components/**/*.{html,js,jsx,ts,tsx,vue,svelte}",
    "./pages/**/*.{html,js,jsx,ts,tsx,vue,svelte,html}",
    "./public/**/*.html",
  ],

  darkMode: "media", // otomatis ikut sistem (light/dark)

  // ⚙️ Nonaktifkan preflight agar CSS lama tidak di-reset
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
      colors: {
        primary: "#0ea5e9",
        secondary: "#f59e0b",
        neutral: "#9ca3af",
        background: "#ffffff",
        surface: "#f9fafb",
        text: "#111827",
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

  plugins: [], // tidak ada plugin untuk menjaga tampilan lama tetap aman
};
