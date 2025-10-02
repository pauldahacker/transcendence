import { defineConfig } from 'vite';
import path from 'path';

const PORT = process.env.FRONTEND_PORT || 3000;

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: PORT,
    allowedHosts: ['frontend']
  }
});
