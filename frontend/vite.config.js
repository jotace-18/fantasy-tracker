import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Leemos la variable VITE_DOCKER manualmente desde el entorno,
// pero sin romper si no está definida.
const isDocker = process.env.VITE_DOCKER === 'true'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: isDocker ? 'http://backend:4000' : 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
