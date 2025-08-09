/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e9ff",
          200: "#b7d6ff",
          300: "#8abaff",
          400: "#5899ff",
          500: "#2a79ff",
          600: "#1f5fe0",
          700: "#1a4bb6",
          800: "#163f93",
          900: "#123474"
        }
      },
      boxShadow: {
        glass: "0 10px 30px rgba(2,12,27,0.08)"
      }
    }
  },
  darkMode: "class",
  plugins: []
}
