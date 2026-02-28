/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'cyber-black': '#020617', // Deepest Slate
        'cyber-slate': '#0f172a', // Mid Slate
        'brand-cyan': '#22d3ee',  // Electric Cyan (Status/Data)
        'brand-gold': '#d4af37',  // Premium Gold (Primary/CTAs)
        'brand-rose': '#f43f5e',  // Error/Reject
        'brand-emerald': '#10b981', // Success/Verify
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'terminal-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scan 4s linear infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      backgroundImage: {
        'cyber-gradient': 'radial-gradient(circle at 50% 0%, #1e293b 0%, #020617 100%)',
      }
    },
  },
  plugins: [],
}