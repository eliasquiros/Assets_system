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
    proxy: {
      // En dev, Vite (5173) y Django (8000) son procesos distintos. changeOrigin
      // se deja en false a proposito: asi Vite reenvia el Host original
      // (ej. demo.localhost:5173) a Django, que es justo lo que
      // TenantMainMiddleware necesita para resolver el schema por subdominio
      // (DA16) — TenantMainMiddleware.hostname_from_request solo descarta el
      // puerto, no el host. Como el fetch del navegador sigue viendo todo como
      // el mismo origen (misma URL relativa /api), las cookies httpOnly que
      // pone el backend tambien quedan en ese mismo origen sin configuracion
      // adicional.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
