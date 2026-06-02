/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#f9f5ef',
          100: '#f1e8dc',
          200: '#e7d9c8'
        },
        ink: {
          900: '#161513',
          700: '#33302c',
          500: '#5b5550'
        },
        burgundy: {
          700: '#6f1d2d',
          600: '#842538',
          500: '#9a2e44'
        },
        brass: {
          400: '#a47e3b'
        }
      },
      fontFamily: {
        serif: ['Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'Palatino', 'serif'],
        sans: ['Avenir Next', 'Segoe UI', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif']
      },
      boxShadow: {
        editorial: '0 1px 0 rgba(0, 0, 0, 0.06), 0 16px 28px -22px rgba(0, 0, 0, 0.25)'
      }
    }
  },
  plugins: []
}
