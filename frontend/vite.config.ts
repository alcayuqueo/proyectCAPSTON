import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    // Compatibilidad con navegadores antiguos (pantallas interactivas y WebView de
    // Android desactualizados). Genera un segundo bundle "legacy" que solo descargan
    // los navegadores que no soportan el moderno.
    // Si se actualiza este plugin, revisar los hashes CSP en vercel.json
    // (cambian con la versión; ver `cspHashes` de @vitejs/plugin-legacy).
    legacy({
      targets: ['defaults', 'chrome >= 49', 'android >= 5', 'safari >= 10'],
      modernPolyfills: true,
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
