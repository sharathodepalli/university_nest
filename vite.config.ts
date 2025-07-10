import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // Import the VitePWA plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // -------------------------------------------------------------------
      // PWA Plugin Configuration for Production Readiness and Caching
      // -------------------------------------------------------------------

      // Choose your Service Worker strategy:
      // 'generateSW': Bundles your Service Worker during build time. Best for simple PWA.
      // 'injectManifest': Allows you to write your own Service Worker and inject manifest.
      // We'll use 'generateSW' for simplicity and auto-updates.
      strategies: 'generateSW',

      // How the Service Worker registration and update is handled:
      // 'autoUpdate': Automatically updates the SW and reloads the page for the new version.
      // 'prompt': Prompts the user to update.
      // 'autoUpdate' is generally preferred for a seamless user experience,
      // as it automatically handles showing the latest version on reload.
      registerType: 'autoUpdate',

      // Specifies where the Service Worker registration code will be injected.
      // 'auto' injects it into your entry HTML.
      injectRegister: 'auto',

      // Control the caching behavior of Workbox (used by generateSW strategy).
      workbox: {
        // globPatterns: Files to precache. This ensures all your essential assets
        // (JS, CSS, HTML, common image formats) are cached for offline use.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpeg,jpg}'],

        // Fix caching issues - exclude API calls and dynamic content from SW cache
        navigateFallback: null, // Disable navigation fallback to prevent stale page serving
        
        // Add runtime caching with proper cache-busting for API calls
        runtimeCaching: [
          {
            // Don't cache Supabase API calls - always fetch fresh
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: 'NetworkOnly', // Always go to network, never cache
          },
          {
            // Cache static assets but allow updates
            urlPattern: /^https:\/\/.*\.vercel\.app\/.*\.(js|css|png|jpg|jpeg|svg|webp)$/,
            handler: 'StaleWhileRevalidate', // Serve from cache, update in background
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
        // runtimeCaching: [
        //   {
        //     urlPattern: /https:\/\/images\.pexels\.com\/.*/, // Pattern for your external image CDN
        //     handler: 'StaleWhileRevalidate', // Serve from cache if available, update in background
        //     options: {
        //       cacheName: 'external-images-cache',
        //       expiration: {
        //         maxEntries: 50,
        //         maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
        //       },
        //     },
        //   },
        //   {
        //     urlPattern: ({ url }) => url.origin === 'https://your.supabase.cdn.com', // Example for Supabase storage CDN
        //     handler: 'CacheFirst', // Prioritize cached version
        //     options: {
        //       cacheName: 'supabase-storage-cache',
        //       expiration: {
        //         maxEntries: 60,
        //         maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Days
        //       },
        //     },
        //   },
        // ],
      },

      // PWA Manifest configuration: Defines how your PWA appears on devices.
      manifest: {
        name: 'UniNest',
        short_name: 'UniNest',
        description: 'Your perfect student housing platform',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      // Development options for Service Worker:
      // 'enabled: true' in dev mode makes debugging SW easier.
      // Remember to clear browser cache/SW when making changes to SW logic.
      devOptions: {
        enabled: true, // Keep enabled in dev for easier testing and debugging
      },

      // -------------------------------------------------------------------
      // End PWA Plugin Configuration
      // -------------------------------------------------------------------
    }),
  ],
  // Other Vite build configurations
  build: {
    outDir: 'dist', // Output directory for the build
    sourcemap: true, // Generate sourcemaps for production debugging
    // This ensures assets are chunked with content hashes for cache busting
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
    },
  },
  // Optionally, configure your server for development
  server: {
    open: true, // Opens browser automatically
    port: 3000,
  },
});