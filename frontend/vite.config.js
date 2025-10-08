import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: process.env.FRONTEND_PORT,

    https: {
      key: '/app/certs/key.pem',
      cert: '/app/certs/cert.pem',
    },
  }
});