import { defineConfig } from 'vite';
import path from 'path';

const PORT = 3001;

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: PORT,

    https: {
      key: '/app/certs/key.pem',
      cert: '/app/certs/cert.pem',
    },
  }
});