import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
          // Don't cache API calls or dynamic content
          navigateFallbackDenylist: [/^\/api/, /^\/auth/],
          runtimeCaching: [
            {
              // Don't cache Supabase API calls - always fetch fresh
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            }
          ]
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'UniNest - Student Housing Platform',
          short_name: 'UniNest',
          description: 'Find verified student housing with .edu email verification',
          theme_color: '#3b82f6',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          orientation: 'portrait-primary',
          categories: ['education', 'lifestyle'],
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: 'icon-512.png', 
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable any'
            }
          ]
        }
      })
    ],
    
    // Production build optimizations
    build: {
      // No source maps in production for security
      sourcemap: mode === 'development',
      
      // Optimize bundle splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor libraries
            'vendor-react': ['react', 'react-dom'],
            'vendor-router': ['react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-ui': ['lucide-react', 'date-fns']
          },
          // Clean file names for better caching
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      },
      
      // Chunk size optimization
      chunkSizeWarningLimit: 1000,
      
      // Use esbuild for faster builds
      minify: mode === 'production' ? 'esbuild' : false,
      
      // Target modern browsers for smaller bundles
      target: 'es2020',
      
      // Enable CSS code splitting
      cssCodeSplit: true
    },
    
    // Dependency optimization
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'react-router-dom', 
        '@supabase/supabase-js',
        'lucide-react',
        'date-fns'
      ]
    },
    
    // Environment variables and build-time constants
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: mode === 'development'
    },
    
    // Preview server configuration (for production testing)
    preview: {
      port: 4173,
      host: true
    },
    
    // Development server configuration
    server: {
      port: 5173,
      host: true
    }
  }
})
