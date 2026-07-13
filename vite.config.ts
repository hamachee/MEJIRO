/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the site at https://<user>.github.io/<repo>/ and the
// path is case-sensitive, so the base must match the repo name exactly.
// CI derives it from the repo name; override with BASE_PATH=/ for root
// deployments (Netlify/Vercel).
const base = process.env.BASE_PATH ?? '/MEJIRO/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MEJIRO — TTRPG Sheet & Roller',
        short_name: 'MEJIRO',
        description:
          'Local-first character sheet, dice-pool builder and roller for non-D&D TTRPGs.',
        theme_color: '#5b4b8a',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
