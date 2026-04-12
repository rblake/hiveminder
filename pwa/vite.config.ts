import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // In production the app is served at tasks.rblake.net/app/
  // vite preview and npm run dev serve from root, so adjust base for local dev
  base: process.env.NODE_ENV === 'production' ? '/app/' : '/',

  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Hiveminder',
        short_name: 'Tasks',
        description: 'Hiveminder task manager',
        start_url: '/app/',
        scope: '/app/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
          {
            src: '/app/icons/192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/app/icons/512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache the app shell (JS/CSS/HTML) for offline access
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Do NOT cache API responses — always fetch live task data
        runtimeCaching: [],
      },
    }),
  ],

  server: {
    // Proxy API calls to local Hiveminder during development
    // Run: HIVEMINDER_URL=http://localhost:8888 npm run dev
    // (or set directly below)
    proxy: {
      '/services': {
        target: process.env.HIVEMINDER_URL ?? 'http://localhost:8888',
        changeOrigin: true,
      },
      '/=/': {
        target: process.env.HIVEMINDER_URL ?? 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
});
