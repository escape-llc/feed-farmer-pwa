import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves this repo from a /feed-farmer-pwa/ subpath, not the
// domain root -- `base` (and the PWA manifest's scope/start_url, which
// must match it or the installed app's navigation breaks outside that
// subpath) only need that prefix for a real production build. Dev/preview
// stay at '/' so `npm run dev` keeps working unchanged.
export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/feed-farmer-pwa/' : '/';

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Feed Farmer',
          short_name: 'FeedFarmer',
          description: 'A premium RSS/Atom feed reader PWA',
          theme_color: '#1a6b3c',
          background_color: '#111318',
          display: 'standalone',
          scope: base,
          start_url: base,
          icons: [
            {
              src: 'favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],
  };
});
