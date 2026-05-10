import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The Glaon UI kit (under @glaon/ui) uses `@/` to point at its own
      // src/. Mirror that alias here so vitest's module loader can
      // resolve transitive kit imports (e.g. Alert → '@/components/base/...').
      '@': path.resolve(dirname, '../../packages/ui/src'),
      // Some kit primitives transitively pull in react-native source via
      // story files; rewrite to `react-native-web` (the same trick
      // packages/ui's vitest config uses) so jsdom doesn't choke on the
      // Flow-syntax react-native entry point.
      'react-native': 'react-native-web',
    },
  },
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
