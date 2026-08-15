/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          bg: '#080c14',
          card: '#0f172a',
          sidebar: '#0b1120',
          border: '#1e293b',
          borderHover: '#334155',
          accent: '#06b6d4',
          accentGlow: 'rgba(6, 182, 212, 0.15)',
        },
        hazard: {
          red: '#ef4444',
          orange: '#f97316',
          yellow: '#eab308',
          green: '#10b981',
          cyan: '#06b6d4',
          purple: '#a855f7'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
