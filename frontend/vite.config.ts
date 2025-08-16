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
    proxy: {
      // Proxy Supabase API calls to avoid CORS issues
      '/rest/v1': {
        target: process.env.VITE_SUPABASE_URL || 'https://ftkeczodadvtnxofrwps.supabase.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/rest\/v1/, '/rest/v1'),
        headers: {
          'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`
        }
      },
      // Proxy WebSocket connections
      '/realtime/v1': {
        target: process.env.VITE_SUPABASE_URL || 'https://ftkeczodadvtnxofrwps.supabase.co',
        changeOrigin: true,
        secure: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/realtime\/v1/, '/realtime/v1')
      },
      // Proxy auth endpoints
      '/auth/v1': {
        target: process.env.VITE_SUPABASE_URL || 'https://ftkeczodadvtnxofrwps.supabase.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/auth\/v1/, '/auth/v1'),
        headers: {
          'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`
        }
      }
    }
  },
  preview: {
    port: 8080,
    host: true,
  },
  base: '/',
  build: {
    target: 'es2019',
    sourcemap: false,
    outDir: 'dist',
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          utils: ['clsx', 'class-variance-authority', 'tailwind-merge', 'date-fns']
        }
      }
    }
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
