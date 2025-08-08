import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    host: true,
  },
  preview: {
    port: 8080,
    host: true,
  },
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          
          // Supabase and related
          'supabase': ['@supabase/supabase-js'],
          
          // UI Components (Radix UI)
          'ui-components': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu', 
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-avatar',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-popover',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-breadcrumb',
            '@radix-ui/react-pagination',
            '@radix-ui/react-slider',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-drawer',
            '@radix-ui/react-sheet',
          ],
          
          // Utilities and helpers
          'utils': ['lucide-react', 'clsx', 'class-variance-authority', 'tailwind-merge'],
          
          // Routing
          'routing': ['react-router-dom'],
          
          // Charts and data visualization
          'charts': ['recharts', 'react-chartjs-2', 'chart.js'],
          
          // Date handling
          'date': ['date-fns', 'dayjs', 'moment'],
          
          // Form handling
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // State management
          'state': ['zustand', 'jotai'],
          
          // HTTP client
          'http': ['axios', 'ky'],
          
          // File handling
          'files': ['file-saver', 'jszip'],
          
          // Crypto and security
          'crypto': ['crypto-js', 'jsencrypt'],
          
          // Icons and UI
          'icons': ['lucide-react', 'react-icons'],
          
          // Validation and schemas
          'validation': ['zod', 'yup', 'joi'],
          
          // Utilities
          'utilities': ['lodash', 'ramda', 'underscore'],
        },
      },
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      '@supabase/supabase-js',
      'react',
      'react-dom',
      'lucide-react',
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
    ],
  },
})
