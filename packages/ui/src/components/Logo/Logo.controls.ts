// `Logo.controls.ts` — single source of truth for the Logo prop matrix.
// Story (`Logo.stories.tsx`) imports the spec and spreads it into
// `meta.args` / `meta.argTypes`; MDX docs (`Logo.mdx`) render it via
// `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const variantOptions = ['wordmark', 'symbol'] as const;
const themeOptions = ['light', 'dark'] as const;

export const logoControls = {
  variant: {
    type: 'inline-radio',
    options: variantOptions,
    default: 'wordmark',
    description:
      'Which mark to render. `wordmark` is the full logotype; `symbol` is the standalone glyph for compact contexts (favicons, avatar fallbacks, top-bar collapse states).',
    category: 'Style',
  } satisfies ControlSpec<(typeof variantOptions)[number]>,
  theme: {
    type: 'inline-radio',
    options: themeOptions,
    default: 'light',
    description:
      'Contrast variant. `light` renders the brand-500 body for light surfaces; `dark` swaps to base-dirty (off-white) for dark or brand-tinted surfaces. Independent from the app `<ThemeProvider>` — pick the value that contrasts with the immediate background.',
    category: 'Style',
  } satisfies ControlSpec<(typeof themeOptions)[number]>,
  background: {
    type: 'color',
    default: 'transparent',
    description:
      'CSS background applied to the wrapper. Defaults to `transparent`. Use the color picker to preview the mark on a brand surface — confirms contrast for the chosen `theme`.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  size: {
    type: 'text',
    description:
      'Width of the rendered mark. Number → `px`; string → forwarded verbatim (`100%`, `4rem`). Height scales via the SVG `viewBox` aspect ratio. Leave empty for the SVG natural size.',
    category: 'Style',
  } satisfies ControlSpec<number | string>,
  padding: {
    type: 'text',
    description:
      'Wrapper padding. Number → `px`; string → forwarded verbatim (`8px`, `0.5rem`, `8px 12px`). Pair with `background` and `radius` for badge / chip presentations.',
    category: 'Style',
  } satisfies ControlSpec<number | string>,
  radius: {
    type: 'text',
    description:
      'Wrapper border-radius. Number → `px`; string → forwarded verbatim (`8px`, `9999px` for a circle). Typically combined with `padding` and `background`.',
    category: 'Style',
  } satisfies ControlSpec<number | string>,
  border: {
    type: 'text',
    description:
      'CSS `border` shorthand applied to the wrapper (`1px solid var(--color-secondary-alt)`, `2px solid currentColor`). Useful for outlined chip presentations.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  href: {
    type: 'text',
    description:
      'Link destination. When set, the wrapper renders as an `<a>` so the entire mark becomes a click target (typical "home" link in a TopBar / SideNav). Mutually exclusive with `onPress`.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  onPress: {
    type: false,
    description:
      'Click handler. When set, the wrapper renders as a `<button>` — use for menu triggers or programmatic actions rather than navigation. Mutually exclusive with `href`. Set per-story via `args.onPress` (the controls panel hides function props).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  label: {
    type: 'text',
    default: 'Glaon',
    description:
      'Accessible label exposed via `aria-label` when the logo is announced as an image. Ignored when `decorative` is true.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  decorative: {
    type: 'boolean',
    default: false,
    description:
      'Hide from assistive tech (`aria-hidden="true"`). Use when the logo is purely ornamental — e.g. paired with a visible "Glaon" wordmark elsewhere on the page.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  className: {
    type: false,
    description: 'Tailwind / className override hook for the wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

export const logoExcludeFromArgs = defineExcludeFromArgs([] as const);
