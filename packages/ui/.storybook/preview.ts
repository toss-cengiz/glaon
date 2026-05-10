import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-native-web-vite';
import { createElement } from 'react';

import { ToastProvider } from '../src/components/Toast';
import { THEME_NAMES, DEFAULT_THEME, ThemeProvider } from '../src/theme';
import { tokens } from '../dist/tokens/rn';

import '../dist/tokens/web.css';
import '../src/styles/globals.css';

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
    docs: {
      // Surface the JSX snippet panel under every story canvas by
      // default — Storybook 10 already renders it on demand via the
      // "Show code" button, but Phase 1.5 wants the source visible
      // without the extra click so consumers learn the API by
      // reading the live snippet next to the rendered output.
      source: {
        state: 'open',
      },
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
        'div',
        { lang: context.globals.locale ?? 'en' },
        createElement(
          ThemeProvider,
          { theme: context.globals.theme ?? DEFAULT_THEME, tokens },
          // Wrap every story in `ToastProvider` so stories that call
          // `useToast()` work without per-story decorators. The
          // provider mounts a portal to `document.body` lazily on
          // mount, so non-toast stories pay no cost.
          createElement(ToastProvider, null, createElement(Story)),
        ),
      ),
  ],
  initialGlobals: {
    theme: DEFAULT_THEME,
    locale: 'en',
  },
  globalTypes: {
    locale: {
      // Toolbar locale switcher (i18n-G / #429). Keeps the toolbar in
      // every story so reviewers can flip between EN and TR while
      // browsing components. Today the toggle just propagates through
      // the `lang` attribute on the story wrapper — primitives stay
      // presentational per the data-fetching boundary, so the demo
      // story under "Foundations / i18n" is the one that actually
      // re-renders strings on switch.
      name: 'Locale',
      description: 'UI locale (#429)',
      defaultValue: 'en',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'tr', title: 'Türkçe' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
