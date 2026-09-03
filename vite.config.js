import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pure Vite config without any local JSON database middleware
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
});
