// `Badge.controls.ts` — single source of truth for Badge's variant
// matrix. Story (`Badge.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Badge.mdx`)
// reads the same spec via `<Controls />`.
//
// Phase 2 expansion (#299): Glaon `<Badge>` is now a parametric wrap
// over the kit's 7 sibling primitives. The new `icon` discriminator
// + slot props (`iconComponent`, `imgSrc`, `flag`, `onClose`) match
// Figma's `Icon` axis 1:1.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';

const typeOptions = ['pill-color', 'color', 'modern'] as const;
const sizeOptions = ['sm', 'md', 'lg'] as const;
const colorOptions = [
  'gray',
  'brand',
  'error',
  'warning',
  'success',
  'slate',
  'sky',
  'blue',
  'indigo',
  'purple',
  'pink',
  'orange',
] as const;
const iconKindOptions = [
  'none',
  'dot',
  'leading',
  'trailing',
  'only',
  'avatar',
  'flag',
  'close',
] as const;

export const badgeControls = {
  children: {
    type: 'text',
    default: 'Label',
    description:
      'Bold inline text shown inside the badge. Keep to 1–2 words; for multi-line use Alert (P2). Optional when `icon === "only"`.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  type: {
    type: 'inline-radio',
    options: typeOptions,
    default: 'pill-color',
    description:
      'Shape variant. `pill-color` is fully rounded; `color` is square-ish; `modern` strips the colour fill for a minimal chip.',
    category: 'Style',
  } satisfies ControlSpec<(typeof typeOptions)[number]>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description: 'Visual scale; `sm` for dense lists, `lg` for headline counts.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  color: {
    type: 'select',
    options: colorOptions,
    default: 'gray',
    description:
      'Semantic palette. Use `success` / `warning` / `error` for status meanings; `brand` for promoted highlights; `gray` for neutral metadata. Note: `type="modern"` always renders the neutral grey treatment regardless of the selected colour (the kit ships only one modern variant; see #258).',
    category: 'Style',
  } satisfies ControlSpec<(typeof colorOptions)[number]>,
  icon: {
    type: 'select',
    options: iconKindOptions,
    default: 'none',
    description:
      "Slot discriminator (matches Figma's Icon axis). `none` (default) renders the bare kit `Badge`; `dot` adds a status dot; `leading` / `trailing` add an icon on the matching side; `only` renders an icon-only chip; `avatar` embeds an image; `flag` embeds a country flag; `close` adds an X dismissal button. Pair with the matching slot prop (`iconComponent` / `imgSrc` / `flag` / `onClose`).",
    category: 'Content',
  } satisfies ControlSpec<(typeof iconKindOptions)[number]>,
  iconComponent: {
    type: 'select',
    options: Object.keys(storybookIcons),
    mapping: storybookIcons,
    description:
      'Icon glyph used when `icon` is `leading`, `trailing`, or `only`. Pulled from the curated storybook picker so every kit `@untitledui/icons` glyph is reachable.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  imgSrc: {
    type: 'text',
    description:
      'Image URL for `icon === "avatar"`. Renders inline as a 16px circular image — pair with a meaningful `children` label so screen readers can announce the entity.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  flag: {
    type: 'text',
    description:
      'ISO-3166-1 alpha-2 country code (e.g. `TR`, `US`, `GB`) for `icon === "flag"`. The kit ships flags for every country code in `FlagTypes`.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  onClose: {
    type: false,
    action: 'close-clicked',
    description:
      'Click handler for the X button when `icon === "close"`. Fires on click + keyboard activation (Space / Enter).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  closeLabel: {
    type: 'text',
    description:
      'Accessible label for the X close button when `icon === "close"`. Forwarded as `aria-label` so screen readers announce the action (e.g. "Remove filter").',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  className: {
    type: false,
    description:
      "Tailwind override hook. Stories don't expose this — consumers can pass extra utility classes when needed.",
  } satisfies ControlSpec<string>,
} as const;

export const badgeExcludeFromArgs = defineExcludeFromArgs([] as const);
