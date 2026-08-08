import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// A separate build target from the GitHub Pages deploy (vite.config.ts):
// one self-contained MEJIRO.html with no server, no install, and nothing
// else in the folder — everything JS/CSS gets inlined by viteSingleFile(),
// and the service worker/manifest (which can't register under file:// anyway,
// and would be pointless for an already-local file) are simply not built by
// omitting VitePWA here. HashRouter (see src/main.tsx) already avoids the
// History API routing that doesn't work under file://.
export default defineConfig({
  base: './',
  // Nothing in public/ is referenced here (the favicon is inlined in
  // MEJIRO.html directly) — disable Vite's default public/ copy so the
  // build output is truly just the one file, not the file plus sidecars.
  publicDir: false,
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-portable',
    rollupOptions: {
      input: 'MEJIRO.html',
    },
  },
});
