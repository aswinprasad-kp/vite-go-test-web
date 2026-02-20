import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isServe = command === 'serve'; // dev server (dev or dev:stage)
  const isDev = mode === 'development';
  const BACKEND_URL = env.VITE_BE_URL || 'http://127.0.0.1:8080';
  const certPath = env.VITE_SSL_CERT_PATH?.trim() || '';
  const keyPath = env.VITE_SSL_KEY_PATH?.trim() || '';
  const certsExist = certPath && keyPath && certPath !== 'undefined' && keyPath !== 'undefined';

  // HTTPS when cert paths are set: dev uses .env.local, dev:stage uses .env.stage (add VITE_SSL_CERT_PATH / VITE_SSL_KEY_PATH there to match Nginx proxy_pass https://127.0.0.1:5173)
  const hasHttps = (isDev || mode === 'stage') && certsExist;
  // Always 0.0.0.0 when serving so localhost + local.work-os.app:5173 + network all work. Only BE URL differs (dev vs dev:stage).
  const devHost = isServe ? '0.0.0.0' : 'localhost';
  return {
    plugins: [react()],
    server: {
      host: devHost,
      port: 5173,
      strictPort: true,
      ...(hasHttps && {
        https: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
      }),
      ...(hasHttps && {
        hmr: { clientPort: 443 },
      }),
      proxy: {
        '^/(api|auth|db|v1)/.*': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})