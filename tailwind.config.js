/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdbff',
          300: '#8ec3ff',
          400: '#599fff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        ink: { 950: '#070a13', 900: '#0b1020', 800: '#11172a', 700: '#1a2138' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0,0,0,0.25)',
        glow: '0 0 32px rgba(59,130,246,0.45)',
      },
      backdropBlur: { xs: '2px' },
      animation: {
        'fade-in': 'fadeIn .4s ease-out',
        'slide-up': 'slideUp .35s cubic-bezier(.2,.8,.2,1)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 0 0 rgba(59,130,246,.45)' }, '50%': { boxShadow: '0 0 0 12px rgba(59,130,246,0)' } },
      },
    },
  },
  plugins: [],
};