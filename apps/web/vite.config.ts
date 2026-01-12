import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@spotify2tidal/types': path.resolve(__dirname, '../../packages/types/src/index.ts')
    }
  },
  base: '/spotify2tidal/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['@tanstack/react-router'],
          'spotify-sdk': ['@spotify/web-api-ts-sdk'],
          'tidal-sdk': ['@tidal-music/api', '@tidal-music/auth']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
