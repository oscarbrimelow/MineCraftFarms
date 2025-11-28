import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  // For GitHub Pages, use the repository name as base path
  // For local dev, use '/' 
  base: process.env.NODE_ENV === 'production' ? '/MineCraftFarms/' : '/',
});
