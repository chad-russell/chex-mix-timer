import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
import fs from 'node:fs'; const packageJson = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8')); export default defineConfig({ define: { __APP_VERSION__: JSON.stringify(packageJson.version) },
  plugins: [react(), basicSsl()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
