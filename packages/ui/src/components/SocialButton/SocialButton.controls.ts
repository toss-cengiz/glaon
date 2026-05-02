// `SocialButton.controls.ts` — single source of truth for
// SocialButton's variant matrix. Story (`SocialButton.stories.tsx`)
// imports the spec and spreads it into `meta.args` /
// `meta.argTypes`; MDX docs reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const brandOptions = ['apple', 'dribbble', 'facebook', 'figma', 'google', 'twitter'] as const;
const styleOptions = ['brand', 'black-outline', 'white-outline', 'icon-only'] as const;
const sizeOptions = ['sm', 'md', 'lg'] as const;

export const socialButtonControls = {
  brand: {
    type: 'select',
    options: brandOptions,
    default: 'google',
    description:
      "Which social provider this button signs the user in with. Drives the brand glyph + canonical brand colour. Mirrors Figma's `Social` axis 1:1 (6 providers).",
    category: 'Content',
  } satisfies ControlSpec<(typeof brandOptions)[number]>,
  style: {
    type: 'inline-radio',
    options: styleOptions,
    default: 'brand',
    description:
      "Visual treatment. `brand` fills with the provider's brand colour (Google blue / Apple black / Facebook navy / etc.); `black-outline` is a white surface with a black border (light page bg); `white-outline` is dark with white border (dark page bg); `icon-only` strips the label and renders a square icon button. Mirrors Figma's `Style` axis.",
    category: 'Style',
  } satisfies ControlSpec<(typeof styleOptions)[number]>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description:
      'Visual scale. `sm` (h-9) for forms, `md` (h-10, default) for sign-in cards, `lg` (h-11) for hero CTAs.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  supportingText: {
    type: 'boolean',
    default: true,
    description:
      "Whether to render `Continue with {brand}` (default) or just `{brand}` next to the glyph. Ignored for `style='icon-only'` (no label rendered at all). Mirrors Figma's `Supporting text` axis.",
    category: 'Content',
  } satisfies ControlSpec<boolean>,
  children: {
    type: 'text',
    description:
      "Override the rendered label entirely (e.g. localised `Apple ile devam et`). Ignored for `style='icon-only'`.",
    category: 'Content',
  } satisfies ControlSpec<string>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Disable the button. Forwarded as `disabled` so axe and screen readers treat it as inert.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  href: {
    type: 'text',
    description:
      'Link destination (typically the OAuth redirect URL). When set, renders as an `<a>` element instead of a `<button>`. Mutually exclusive with `onPress`.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  onPress: {
    type: false,
    action: 'pressed',
    description: 'Click handler for the `<button>` variant. Fires on click + keyboard activation.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer button.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  'aria-label': {
    type: 'text',
    description:
      "Accessible label override. **Required** for `style='icon-only'` so screen readers can announce the provider name (the icon glyph isn't a text node). For other styles the visible label provides the accessible name automatically.",
    category: 'A11y',
  } satisfies ControlSpec<string>,
} as const;

export const socialButtonExcludeFromArgs = defineExcludeFromArgs([] as const);
