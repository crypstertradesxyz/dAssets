/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rh: {
          green: '#00C805',
          greenHover: '#00E006',
          darkGreen: '#003808',
          bg: '#050708',
          surface: '#0E1114',
          surfaceBorder: '#1A2026',
          card: '#13181E',
          cardBorder: '#1F2833',
          muted: '#8A99A8',
          subtle: '#4A5568',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(0, 200, 5, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(0, 200, 5, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
