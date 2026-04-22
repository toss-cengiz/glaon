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
      // Ratchet scope: only primitives with active tests. See docs/testing.md.
      include: ['src/components/Button/**/*.{ts,tsx}'],
      exclude: ['**/*.stories.tsx', '**/*.test.{ts,tsx}', '**/index.ts'],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },
  },
});
