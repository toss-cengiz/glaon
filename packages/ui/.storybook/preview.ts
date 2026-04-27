import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-native-web-vite';
import { createElement } from 'react';

import { THEME_NAMES, DEFAULT_THEME, ThemeProvider } from '../src/theme';
import { tokens } from '../dist/tokens/rn';

import '../dist/tokens/web.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: Object.fromEntries(THEME_NAMES.map((name) => [name, name])),
      defaultTheme: DEFAULT_THEME,
      attributeName: 'data-theme',
    }),
    (Story, context) =>
      createElement(
        ThemeProvider,
        { theme: context.globals.theme ?? DEFAULT_THEME, tokens },
        createElement(Story),
      ),
  ],
  initialGlobals: {
    theme: DEFAULT_THEME,
  },
};

export default preview;
