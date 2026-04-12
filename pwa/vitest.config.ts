import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Point the API client at the MSW-intercepted origin so fetch URLs
    // match the handlers registered in src/test/handlers.ts.
    env: {
      VITE_API_BASE: 'https://tasks.rblake.net',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
