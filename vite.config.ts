import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Offline-first (PRD 22): every file the app needs, fonts and icons included, is cached on first load.
    // Updates wait for the user to accept them, so a change never reloads the page under an unsaved edit.
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Daybook',
        short_name: 'Daybook',
        description: "A place to keep what's on your mind, plan your days, and see what actually happened.",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#F3EFE6',
        theme_color: '#F3EFE6',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  css: {
    modules: { localsConvention: 'camelCaseOnly' },
  },
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
    include: ['src/**/*.test.ts'],
  },
})
