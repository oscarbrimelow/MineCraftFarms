import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // For GitHub Pages, always use the repository name as base path
  // Check if we're in production build or if GITHUB_PAGES is set
  const isProduction = mode === 'production' || process.env.GITHUB_PAGES === 'true';
  const base = isProduction ? '/MineCraftFarms/' : '/';

  return {
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
    base,
  };
});
