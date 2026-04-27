// Theme contract for `@glaon/ui` consumers.
//
// `light` and `dark` are the two surfaces the design system commits to. The
// underlying token source (currently single-mode Paint/Effect/Text Styles
// exported from Figma) does not yet emit a separate dark binding — both
// branches resolve to the same token values until Variables collections add
// a Theme: Dark mode (tracked in #140 follow-up). Code consumers can already
// switch on `ThemeName` so the eventual dark binding lands without an API
// change here.

export type ThemeName = 'light' | 'dark';

export const THEME_NAMES = ['light', 'dark'] as const;

export const DEFAULT_THEME: ThemeName = 'light';
