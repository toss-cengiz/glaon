import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Ratchet scope: only modules with active tests. Broadens as the
      // web app grows — see docs/testing.md § coverage thresholds.
      include: ['src/App.tsx'],
      exclude: ['**/*.test.{ts,tsx}', '**/main.tsx', '**/vite-env.d.ts'],
      thresholds: {
        statements: 40,
        branches: 40,
        functions: 40,
        lines: 40,
      },
    },
  },
});
