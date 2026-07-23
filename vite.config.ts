import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // Relative asset URLs required for Capacitor file:// / capacitor://
  base: './',
  publicDir: 'public',
  server: {
    port: 5280,
    strictPort: true,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
