import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: 'esbuild',
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  // SPA routing configuration
  preview: {
    port: 8080,
    host: true,
    historyApiFallback: true,
  },
}));
