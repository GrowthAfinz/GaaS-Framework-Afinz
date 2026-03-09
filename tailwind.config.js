/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0f172a',
        },
        // Afinz Brand Tokens (Manual de Marca)
        afinz: {
          teal: '#00c6cc',
          'teal-dark': '#007c80',
          orange: '#f8a538',
          red: '#e74742',
        },
      },
      fontFamily: {
        // Lembra font family (Afinz brand) com fallbacks
        lembra: ['Lembra', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
