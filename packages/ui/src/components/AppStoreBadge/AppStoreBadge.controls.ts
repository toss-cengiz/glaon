// `AppStoreBadge.controls.ts` — single source of truth for
// AppStoreBadge's variant matrix. Story
// (`AppStoreBadge.stories.tsx`) imports the spec and spreads it
// into `meta.args` / `meta.argTypes`; MDX docs reads the same spec
// via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const storeOptions = [
  'app-store',
  'mac-app-store',
  'google-play',
  'galaxy-store',
  'app-gallery',
] as const;
const themeOptions = ['dark', 'light'] as const;

export const appStoreBadgeControls = {
  store: {
    type: 'select',
    options: storeOptions,
    default: 'app-store',
    description:
      "Which store this badge links to. Drives the brand glyph + top/bottom-line label. Mirrors Figma's `Store` axis 1:1 (5 platforms — App Store / Mac App Store / Google Play / Galaxy Store / AppGallery).",
    category: 'Content',
  } satisfies ControlSpec<(typeof storeOptions)[number]>,
  theme: {
    type: 'inline-radio',
    options: themeOptions,
    default: 'dark',
    description:
      "Badge surface tone. `dark` (default — black badge with white text) for placement on a light page; `light` (white badge with dark text) for placement on a dark page. Mirrors Figma's `Dark background` axis (renamed for clarity — the prop describes the badge colour, not the page).",
    category: 'Style',
  } satisfies ControlSpec<(typeof themeOptions)[number]>,
  href: {
    type: 'text',
    description:
      'Link destination (the platform-specific download URL). When set, renders as an `<a>` element. Mutually exclusive with `onPress`.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  onPress: {
    type: false,
    action: 'pressed',
    description:
      'Click handler for the `<button>` variant. Useful for analytics-tracking flows that intercept the click before redirecting.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer badge.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

export const appStoreBadgeExcludeFromArgs = defineExcludeFromArgs([] as const);
