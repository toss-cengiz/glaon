import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      // F6 prop-coverage test imports both web and RN stories; rerouting
      // `react-native` → `react-native-web` lets the jsdom unit project
      // load `PressableButton.stories.tsx` without choking on RN's Flow
      // entry (`node_modules/react-native/index.js` ships unparsed Flow
      // syntax that Vitest's transformer can't handle).
      'react-native': 'react-native-web',
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
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
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            storybookScript: 'pnpm --filter @glaon/ui storybook',
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
