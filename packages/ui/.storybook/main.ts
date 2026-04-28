import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { defineMain } from '@storybook/react-native-web-vite/node';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineMain({
  framework: '@storybook/react-native-web-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-designs',
    // `addon-docs` enables MDX file processing — Storybook 10 ships
    // autodocs in core but `*.mdx` parsing needs this addon
    // explicitly so Phase 1.5's per-component docs pages compile.
    '@storybook/addon-docs',
    '@storybook/addon-themes',
    '@storybook/addon-vitest',
    'storybook-dark-mode',
    {
      name: '@storybook/addon-mcp',
      options: {
        toolsets: {
          dev: true,
          docs: true,
          test: true,
        },
      },
    },
  ],
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
  viteFinal: async (config) => {
    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string> | undefined),
      '@': path.resolve(dirname, '../src'),
    };
    return config;
  },
});
