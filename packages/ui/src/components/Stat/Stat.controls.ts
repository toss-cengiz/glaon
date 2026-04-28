// `Stat.controls.ts` — single source of truth for Stat's variant
// matrix. Story (`Stat.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Stat.mdx`)
// reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md', 'lg'] as const;

export const statControls = {
  label: {
    type: 'text',
    default: 'Total revenue',
    description:
      'Caption rendered under the value (e.g. "Total revenue", "Active users", "Conversion rate"). Pairs visually with the metric value above it.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  value: {
    type: 'text',
    default: '$32,400',
    description:
      'Headline metric — the dominant character of the card. Typically a number or currency string; ReactNode is accepted for richer formatting.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description:
      'Visual scale. `sm` for tight dashboards, `md` for default cards, `lg` for hero KPIs.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  delta: {
    type: 'object',
    description:
      'Optional change indicator: `{ value: "+12.5%", direction: "up" | "down" | "neutral" }`. Renders an arrow + colored text next to the value.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  prefix: {
    type: false,
    description:
      'Leading slot rendered before the value — typically a currency icon, unit, or trend mini-chart. Accepts any ReactNode.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer container.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

export const statExcludeFromArgs = defineExcludeFromArgs([] as const);
