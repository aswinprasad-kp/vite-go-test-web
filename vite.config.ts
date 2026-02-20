import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development'; // Check if we are local
  const BACKEND_URL = env.VITE_BE_URL || 'http://127.0.0.1:8080';
  const certPath = String(env.VITE_SSL_CERT_PATH);
  const keyPath = String(env.VITE_SSL_KEY_PATH);

  // return {
  //   plugins: [react()],
  //   server: {
  //     host: 'local.work-os.app',
  //     // Only attempt to load certs if we are in local dev mode
  //     ...(isDev && {
  //       https: {
  //         key: fs.readFileSync(keyPath),
  //         cert: fs.readFileSync(certPath),
  //       },
  //     }),
  //     proxy: {
  //       '^/(api|auth|db|v1)/.*': {
  //         target: BACKEND_URL,
  //         changeOrigin: true,
  //         secure: false,
  //       },
  //     },
  //   },
  // }

  return {
    plugins: [react()],
    server: {
      host: 'local.work-os.app',
      port: 5173,
      // StrictPort ensures Vite doesn't accidentally hop to 5174 if 5173 is busy,
      // which would break the Nginx link.
      strictPort: true, 
      ...(isDev && {
        https: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
      }),
      hmr: {
        // This tells React's "Live Reload" to go through Nginx (port 443)
        // instead of trying to hit Vite directly on 5173.
        clientPort: 443, 
      },
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