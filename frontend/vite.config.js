import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Permite abrir el dev server como acme.localhost:5173, beta.localhost:5173,
    // etc. para probar el enrutamiento por subdominio (DA16) sin configuracion
    // adicional: los navegadores modernos ya resuelven *.localhost a 127.0.0.1,
    // pero Vite rechaza por defecto cualquier Host header no reconocido.
    allowedHosts: ['.localhost'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
