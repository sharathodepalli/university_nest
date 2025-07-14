import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // Import the VitePWA plugin

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      VitePWA({
        strategies: 'generateSW',
        registerType: 'autoUpdate',
        injectRegister: 'auto',

        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpeg,jpg}'],
          navigateFallback: null,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/maps\.googleapis\.com\/.*$/,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/.*\.vercel\.app\/.*\.(js|css|png|jpg|jpeg|svg|webp)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-assets',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24,
                },
              },
            },
          ],
        },
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
        devOptions: {
          enabled: true,
        },
      }),
    ],
    build: {
      outDir: 'dist',
      sourcemap: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        external: ['nodemailer'], // Exclude nodemailer from bundle
        output: {
          entryFileNames: `assets/[name]-[hash].js`,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`,
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
    // Define Node.js polyfills for browser environment
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      global: 'globalThis',
    },
    optimizeDeps: {
      exclude: ['nodemailer'], // Don't try to optimize nodemailer for browser
    },
    // Optionally, configure your server for development
    server: {
      open: true, // Opens browser automatically
      port: 3000,
    },
  };
});