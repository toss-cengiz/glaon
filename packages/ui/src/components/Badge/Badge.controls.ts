// `Badge.controls.ts` — single source of truth for Badge's variant
// matrix. Story (`Badge.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Badge.mdx`)
// reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

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

export const badgeControls = {
  children: {
    type: 'text',
    default: 'Label',
    description:
      'Bold inline text shown inside the badge. Keep to 1–2 words; for multi-line use Alert (P2).',
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
  className: {
    type: false,
    description:
      "Tailwind override hook. Stories don't expose this — consumers can pass extra utility classes when needed.",
  } satisfies ControlSpec<string>,
} as const;

export const badgeExcludeFromArgs = defineExcludeFromArgs([] as const);
