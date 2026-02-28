/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'premium-black': '#0a0a0b',
        'premium-slate': '#161618',
        'premium-accent': '#e5e7eb', // Soft white/silver
        'brand-gold': '#d4af37',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Lexend', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
      }
    },
  },
  plugins: [],
}