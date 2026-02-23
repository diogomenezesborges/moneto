import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    passWithNoTests: true,
    include: [
      'lib/**/*.{test,spec}.{js,ts,tsx}',
      'app/**/*.{test,spec}.{js,ts,tsx}',
      'components/**/*.{test,spec}.{js,ts,tsx}',
    ],
    exclude: ['node_modules/**', '.next/**', 'e2e/**', 'frontend/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'coverage/',
        'e2e/',
        'frontend/',
        '**/*.config.{js,ts}',
        '**/types/**',
        '**/*.d.ts',
        // UI components - better tested with E2E tests
        'components/ui/**',
        'app/features/**/components/**',
        'app/**/page.tsx', // Next.js pages (UI components)
        'app/**/layout.tsx', // Next.js layouts (UI components)
        // File parsers - integration tests
        'lib/parsers.ts',
        'lib/parsers/**',
        // Category normalization - edge case heavy, integration tested
        'lib/bank-normalizer.ts',
        // Test utilities and re-export files
        '**/test-utils.{ts,tsx}',
        '**/index.ts', // Re-export files
      ],
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 75,
        lines: 75,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
