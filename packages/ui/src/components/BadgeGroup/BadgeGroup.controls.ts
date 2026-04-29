// `BadgeGroup.controls.ts` — single source of truth for BadgeGroup's
// variant matrix. Story (`BadgeGroup.stories.tsx`) imports the spec
// and spreads it into `meta.args` / `meta.argTypes`; MDX docs
// (`BadgeGroup.mdx`) reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';

const sizeOptions = ['sm', 'md', 'lg'] as const;
const placementOptions = ['leading', 'trailing'] as const;
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

export const badgeGroupControls = {
  children: {
    type: 'text',
    default: 'Read post',
    description:
      'Main inline text label. Keep it short — the pill must fit on one line on common viewports.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  addon: {
    type: false,
    description:
      'Inner Badge node, typically `<Badge size="sm">What\'s new</Badge>`. Any ReactNode works (custom counter chip, status pill, tag, …).',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  addonPlacement: {
    type: 'inline-radio',
    options: placementOptions,
    default: 'leading',
    description:
      "Where the addon sits relative to the label. Mirrors Figma's `Badge` axis (`Leading` / `Trailing`).",
    category: 'Style',
  } satisfies ControlSpec<(typeof placementOptions)[number]>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description:
      'Visual scale. `sm` for dense headers; `md` (default) for hero strips; `lg` for marketing CTAs.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  color: {
    type: 'select',
    options: colorOptions,
    default: 'gray',
    description:
      'Surface palette for the outer pill. Mirrors Badge color tokens — pick `brand` for promo announcements, `success` for celebratory release notes, `gray` (default) for neutral updates.',
    category: 'Style',
  } satisfies ControlSpec<(typeof colorOptions)[number]>,
  trailingIcon: {
    type: 'select',
    options: Object.keys(storybookIcons),
    mapping: storybookIcons,
    description:
      'Trailing icon (commonly a chevron-right indicator). Decorative — `aria-hidden` is forwarded so the label carries the meaning.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  onPress: {
    type: false,
    action: 'pressed',
    description:
      'Click handler. Setting it (without `href`) renders the group as a `<button>` so the whole pill becomes keyboard-activatable.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  href: {
    type: 'text',
    description:
      'Link destination. Setting it renders the group as an `<a>`. Mutually exclusive with `onPress` — prefer `href` when the destination is shareable.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer pill.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

export const badgeGroupExcludeFromArgs = defineExcludeFromArgs([] as const);
