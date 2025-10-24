/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./artikel/**/*.{html,js,jsx,ts,tsx,vue,svelte,astro,md,mdx}",
    "./ext/**/*.{js,jsx,ts,tsx,vue,svelte}",
  ],

  // 🌗 Mode gelap otomatis mengikuti preferensi sistem
  darkMode: "media",

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },

    extend: {
      // 🎨 Warna adaptif pakai CSS Variable (aman & valid)
      colors: {
        background: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#eab308",
        info: "#3b82f6",
      },

      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Merriweather", "ui-serif", "serif"],
        mono: ["Fira Code", "ui-monospace", "monospace"],
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0,0,0,0.08)",
        strong: "0 4px 20px rgba(0,0,0,0.15)",
      },

      spacing: {
        128: "32rem",
        144: "36rem",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.6s ease-out",
        fadeUp: "fadeUp 0.8s ease-out",
      },
    },
  },

  plugins: [],
};
