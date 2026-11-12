/** @type {import('tailwindcss').Config} */
export default {
  // Só o módulo Notion usa variantes dark:, presas à classe .dark na raiz do módulo.
  darkMode: 'class',
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
          ice: '#f0fdfa',
          'ice-light': '#f8fdfd',
        },
      },
      boxShadow: { xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
      backdropBlur: { xs: '2px' },
      fontFamily: {
        // Lembra font family (Afinz brand) com fallbacks
        lembra: ['Lembra', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
