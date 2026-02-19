import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Using 127.0.0.1 is often more stable than 'localhost' for Node.js proxies
  const BACKEND_URL = env.VITE_BE_URL || 'http://127.0.0.1:8080';

  return {
    plugins: [react()],
    server: {
      proxy: {
        // This catches /api, /auth, /db, and anything else you add in Go
        '^/(api|auth|db|v1)/.*': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})