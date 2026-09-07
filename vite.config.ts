import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    watch: {
      // Prevent Vite from reloading the page when Wrangler updates the local SQLite D1 database
      ignored: ['**/.wrangler/**', '**/.wrangler/**/*', '**/.git/**'],
    },
    proxy: {
      // Proxy all /api/* requests to the local Wrangler Worker dev server
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
