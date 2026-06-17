import { defineConfig } from 'vite';

export default defineConfig({
  base: '/pal.js/',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  server: {
    open: true,
  },
});
