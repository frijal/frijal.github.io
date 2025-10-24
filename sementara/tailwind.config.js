/** @type {import('tailwindcss').Config} */
module.exports = {
  // 🔍 Semua lokasi file tempat Tailwind mencari class
  content: [
    "./*.{html,js,jsx,ts,tsx,vue,svelte,astro,md,mdx}",
    ],

  // 🌗 Mode gelap otomatis mengikuti sistem (media)
  // 👉 Ubah ke "class" jika ingin pakai toggle manual
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
      // 🎨 Warna adaptif (otomatis berubah di mode gelap)
      colors: {
        // Warna utama (otomatis menyesuaikan sistem)
        primary: {
          DEFAULT: "#0ea5e9", // terang
          dark: "#38bdf8",    // untuk dark mode
        },
        secondary: {
          DEFAULT: "#f59e0b",
          dark: "#fbbf24",
        },
        neutral: {
          light: "#f3f4f6",
          DEFAULT: "#9ca3af",
          dark: "#1f2937",
        },
        background: {
          light: "#ffffff",
          dark: "#0f172a",
        },
        surface: {
          light: "#f9fafb",
          dark: "#1e293b",
        },
        text: {
          light: "#111827",
          dark: "#f9fafb",
        },
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#eab308",
        info: "#3b82f6",
      },

      // 🧬 Font modern
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Merriweather", "ui-serif", "serif"],
        mono: ["Fira Code", "ui-monospace", "monospace"],
      },

      // 🌸 Radius dan shadow lembut
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0,0,0,0.08)",
        strong: "0 4px 20px rgba(0,0,0,0.15)",
      },

      // 📏 Spacing tambahan
      spacing: {
        128: "32rem",
        144: "36rem",
      },

      // 🎞️ Animasi halus
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

  // 🔌 Plugin Tailwind resmi
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/container-queries"),
  ],
};
