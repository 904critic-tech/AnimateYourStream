import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@components': resolve(__dirname, './src/components'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@assets': resolve(__dirname, './src/assets')
    }
  },
  server: {
    port: 3001,
    host: true,
    allowedHosts: 'all'
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000, // Increase limit for Three.js
    rollupOptions: {
      output: {
        // Phase 3: Real chunking strategy for optimal loading
        // manualChunks: {
        //   // Core React and UI
        //   'react-vendor': ['react', 'react-dom'],

        //   // Three.js core - separate from addons for better caching
        //   'three-core': ['three'],

        //   // Three.js addons and helpers
        //   'three-addons': ['@react-three/fiber', '@react-three/drei'],

        //   // UI and utility libraries
        //   'ui-libs': ['zustand', 'react-error-boundary']
        // },
        
        // Optimize chunk loading
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    // Safe default minifier to avoid breaking semantics in production
    minify: 'esbuild',

    // Asset optimization
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    sourcemap: false
  },

  // Pre-bundle dependencies for faster dev startup
  optimizeDeps: {
    include: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'react',
      'react-dom',
      'zustand'
    ],
    exclude: []
  },

  // Performance hints
  esbuild: {
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  }
})
