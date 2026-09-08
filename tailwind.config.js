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
          bg: '#050608',
          surface: '#0B0D12',
          surfaceBorder: 'rgba(255, 255, 255, 0.08)',
          card: '#0F1218',
          cardBorder: 'rgba(255, 255, 255, 0.12)',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
