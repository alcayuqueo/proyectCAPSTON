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
        // Texto: azul tinta en vez de negro, más amable para un software escolar
        ink: {
          900: '#1E2A3A',
          700: '#3A4757',
          500: '#55616E',
          300: '#A9B2BC',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#FFF8EC', // fondo crema
          sidebar: '#FFFDF7',
        },
        // Modo presentación (lo ven los estudiantes): estilo lúdico
        crema: '#FFF8EC',
        tinta: { DEFAULT: '#1E2A3A', suave: '#4A5868' },
        sol: '#FFC93C',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        infantil: ['Fredoka', 'Nunito', 'system-ui', 'sans-serif'],
        ronda: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sticker: '8px 8px 0 #1E2A3A',
        'sticker-sm': '4px 4px 0 #1E2A3A',
        marco: '10px 10px 0 var(--tema-fuerte)',
      },
      borderRadius: {
        card: '20px',
      },
    },
  },
  plugins: [],
};
