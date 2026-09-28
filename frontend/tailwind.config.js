/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefaf6',
          100: '#d3f2e7',
          400: '#2fa787',
          500: '#0f8a6f',
          600: '#0c6f59', // acento principal (botón "Explorar currículum")
          700: '#0a5a48',
          900: '#0a2e26', // texto/ícono oscuro del logo
        },
        ink: {
          900: '#1a1f1c',
          700: '#3f4744',
          500: '#6b7370',
          300: '#aab0ad',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f6f8f7',
          sidebar: '#fbfbfa',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
