import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    modules: { localsConvention: 'camelCaseOnly' },
  },
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
    include: ['src/**/*.test.ts'],
  },
})
