import { defineMain } from '@storybook/react-vite/node';

export default defineMain({
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    'storybook-dark-mode',
    {
      name: '@storybook/addon-mcp',
      options: {
        toolsets: {
          dev: true,
          docs: true,
        },
      },
    },
  ],
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
});
