// `ProgressBar.controls.ts` — single source of truth for ProgressBar's
// variant matrix. Story (`ProgressBar.stories.tsx`) imports the spec
// and spreads it into `meta.args` / `meta.argTypes`; MDX docs
// (`ProgressBar.mdx`) reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const labelPositionOptions = ['right', 'bottom', 'top-floating', 'bottom-floating'] as const;

export const progressBarControls = {
  value: {
    type: 'number',
    min: 0,
    max: 100,
    step: 1,
    default: 60,
    description:
      'Current progress value. Coerced into a 0–100 percent against `min` / `max` for the bar fill and the formatted label.',
    category: 'Content',
  } satisfies ControlSpec<number>,
  min: {
    type: 'number',
    min: 0,
    max: 100,
    step: 1,
    default: 0,
    description: 'Lower bound of the value range. Default 0.',
    category: 'Content',
  } satisfies ControlSpec<number>,
  max: {
    type: 'number',
    min: 0,
    max: 1000,
    step: 10,
    default: 100,
    description: 'Upper bound of the value range. Default 100.',
    category: 'Content',
  } satisfies ControlSpec<number>,
  labelPosition: {
    type: 'inline-radio',
    options: labelPositionOptions,
    default: 'right',
    description:
      'Where the formatted percentage label renders relative to the bar. `right` / `bottom` pin the text statically; `top-floating` / `bottom-floating` track the fill horizontally with a tooltip-style chip.',
    category: 'Style',
  } satisfies ControlSpec<(typeof labelPositionOptions)[number]>,
  valueFormatter: {
    type: false,
    action: 'format',
    description:
      'Optional `(value, percentage) => ReactNode` formatter. Receives both the raw value and the calculated percentage so consumers can render units (`32 / 100 MB`, `3 of 5 steps`).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer track element.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  progressClassName: {
    type: false,
    description: 'Tailwind override hook for the inner fill element.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  'aria-label': {
    type: 'text',
    default: 'Progress',
    description:
      'Accessible name for the progressbar. Required by axe `aria-progressbar-name` whenever no `aria-labelledby` points at a labelling element.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  'aria-labelledby': {
    type: 'text',
    description: 'ID(s) of element(s) that label the progressbar. Alternative to `aria-label`.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
} as const;

export const progressBarExcludeFromArgs = defineExcludeFromArgs([] as const);
