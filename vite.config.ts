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

    // Performance optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.warn'],
        passes: 3,
        toplevel: true,
        unsafe: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        dead_code: true,
        hoist_funs: true,
        hoist_vars: true,
        if_return: true,
        join_vars: true,
        loops: true,
        reduce_vars: true,
        sequences: true,
        side_effects: true,
        unused: true
      },
      mangle: {
        safari10: true,
        toplevel: true,
        properties: {
          regex: /^_/
        },
        reserved: ['__REACT_DEVTOOLS_GLOBAL_HOOK__']
      },
      format: {
        comments: false,
        beautify: false,
        indent_level: 0
      }
    },

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
