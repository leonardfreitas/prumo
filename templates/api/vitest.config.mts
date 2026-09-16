import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  resolve: {
    alias: { '@': `${import.meta.dirname}/src` },
  },
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup.ts'],
    pool: 'forks',
    coverage: { provider: 'v8', include: ['src/**'] },
  },
})
