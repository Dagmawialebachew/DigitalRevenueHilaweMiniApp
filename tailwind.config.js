/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'terminal-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scan 4s linear infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      backgroundImage: {
        'cyber-gradient': 'radial-gradient(circle at 50% 0%, #1e293b 0%, #020617 100%)',
      }
    },
  },
  plugins: [],
};