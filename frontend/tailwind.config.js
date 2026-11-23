/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        warm: {
          50: '#fcfbf9',
          100: '#f7f6f2',
          200: '#eeebe2',
          300: '#dfdacd',
          400: '#c5bdaf',
        },
        brand: {
          DEFAULT: '#0f172a', // Dark Navy
          accent: '#0d9488',  // Muted Teal / Green
          accentHover: '#0f766e',
          light: '#f0fdf4',
          badge: '#e0f2fe'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
