/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F4EFE6',
          300: '#E8DECE',
        },
        forest: {
          50: '#E8EFEA',
          100: '#C7D9CC',
          500: '#2A5C43',
          600: '#1F4733',
          700: '#183D2B',
          800: '#122E20',
          900: '#0C1E15',
        },
        sage: {
          50: '#F3F6F3',
          100: '#E2EAE1',
          300: '#B8CDB5',
          400: '#8FA58B',
          500: '#758C71',
          600: '#5C7058',
        },
        gold: {
          50: '#FAF5EC',
          100: '#F2E6CE',
          400: '#D6AE6E',
          500: '#C59A5B',
          600: '#A98045',
        },
        charcoal: {
          50: '#F6F6F6',
          100: '#E7E7E7',
          700: '#3D3D3D',
          800: '#2D2D2D',
          900: '#242424',
          950: '#171717',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(24, 61, 43, 0.06), 0 2px 6px -1px rgba(24, 61, 43, 0.04)',
        'elevated': '0 10px 30px -4px rgba(24, 61, 43, 0.1), 0 4px 10px -2px rgba(24, 61, 43, 0.05)',
      }
    },
  },
  plugins: [],
}
