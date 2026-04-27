// ThemeProvider — RN-friendly context that exposes the active theme name
// alongside whatever token object the consumer passes in. Web consumers
// usually rely on the CSS custom properties under `:root` (loaded from
// `dist/tokens/web.css`) and only reach for this provider when they need
// to read tokens in JS. RN consumers wrap their root with
// `<ThemeProvider tokens={tokens}>` (importing tokens from
// `@glaon/ui/dist/tokens/rn`) and read the same object via `useTheme()`.
//
// Tokens are passed in as a generic prop instead of imported here so the
// `rootDir: "src"` boundary in the package's tsconfig stays intact —
// generated build artifacts under `dist/` are not part of the source
// graph.
//
// Light/dark switching is structurally supported but currently a no-op for
// values: the source tokens are single-mode until Variables collections
// add Theme: Dark (see #140 follow-up). The boundary is documented so
// consumer code can adopt the API now and pick up the dark binding the
// moment F2 emits theme-aware outputs.

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { DEFAULT_THEME, type ThemeName } from './types';

export interface ThemeContextValue<TTokens = unknown> {
  /** Active theme name. Switch via the `theme` prop on `ThemeProvider`. */
  name: ThemeName;
  /** Resolved design tokens for the active theme. The shape is whatever
   * the consumer passed to `<ThemeProvider tokens={...}>` — typically the
   * `tokens` export from `@glaon/ui/dist/tokens/rn`. */
  tokens: TTokens;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps<TTokens = unknown> {
  /** Active theme. Defaults to `light`. Pass `dark` to opt into the dark
   * surface (no value-level difference until F2 emits theme-aware tokens). */
  theme?: ThemeName;
  /** Token object exposed via `useTheme()`. Consumers import the generated
   * tokens from `@glaon/ui/dist/tokens/rn` and pass them here. */
  tokens: TTokens;
  children: ReactNode;
}

export function ThemeProvider<TTokens>({
  theme = DEFAULT_THEME,
  tokens,
  children,
}: ThemeProviderProps<TTokens>) {
  const value = useMemo<ThemeContextValue<TTokens>>(
    () => ({ name: theme, tokens }),
    [theme, tokens],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Read the active theme inside a component subtree. Throws if called
 * outside `<ThemeProvider>` — explicit failure is preferable to silently
 * returning a fallback that masks a missing wrapper at the app root.
 */
export function useTheme<TTokens = unknown>(): ThemeContextValue<TTokens> {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return ctx as ThemeContextValue<TTokens>;
}
