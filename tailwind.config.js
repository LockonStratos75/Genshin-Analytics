/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0d13",
          900: "#0e1219",
          850: "#121722",
          800: "#171d2a",
          700: "#1f2736",
          600: "#2b3548",
        },
        mist: {
          DEFAULT: "#e9ecf4",
          dim: "#a4adc0",
          faint: "#6b7488",
        },
        gold: {
          300: "#f2cf8d",
          400: "#e8bc66",
          500: "#dfa94a",
          600: "#c08f36",
        },
        rarity: {
          5: "#ffb547",
          4: "#b39ce8",
          3: "#6fa8dc",
          2: "#7fbd8f",
          1: "#9aa3b5",
        },
        element: {
          pyro: "#ff8a65",
          hydro: "#54c8f0",
          electro: "#b48fff",
          cryo: "#a3ddec",
          anemo: "#71e0b5",
          geo: "#f2c14e",
          dendro: "#a8ce45",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        raise: "0 8px 28px rgba(0,0,0,0.35)",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
