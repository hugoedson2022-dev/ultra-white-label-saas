import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Garante que o build vai para a pasta que o Node.js está esperando
    outDir: 'dist',
  },
  server: {
    // Proxy apenas para desenvolvimento local (npm run dev)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})