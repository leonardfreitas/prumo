import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': `${import.meta.dirname}/src` } },
  test: { globals: true, include: ['src/**/*.spec.{ts,tsx}'] },
})
