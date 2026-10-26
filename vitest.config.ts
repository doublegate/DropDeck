import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.tsx'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'tests/',
        'e2e/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/types/**',
        'src/app/**/*.tsx', // Next.js pages/layouts (tested via E2E)
        'src/lib/db/**', // Database layer (tested via integration)
        'src/lib/trpc/**', // tRPC setup (tested via integration)
      ],
      // Baseline coverage floor enforced in CI to prevent regressions
      thresholds: {
        statements: 12,
        branches: 11,
        functions: 11,
        lines: 12,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
