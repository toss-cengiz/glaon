// `Calendar.controls.ts` — single source of truth for Calendar's
// variant matrix. Story imports the spec and spreads it into
// `meta.args` / `meta.argTypes`; MDX docs reads the same spec via
// `<Controls />`.
//
// Calendar is the inline (no-trigger) variant of the date picker —
// most of RAC `<Calendar>`'s props are calendar-grid concerns
// (`focusedValue`, `pageBehavior`, `firstDayOfWeek`) that don't make
// sense as Storybook knobs. We expose the practical subset.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

export const calendarControls = {
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Disable the calendar grid. Tab focus is suppressed; cells render in the disabled colour scheme.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isReadOnly: {
    type: 'boolean',
    default: false,
    description:
      'Read-only — the grid remains focusable / arrow-navigable but selection is suppressed.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isInvalid: {
    type: 'boolean',
    default: false,
    description:
      'Flips the grid into the invalid state. Pair with a sibling error message in the surrounding form-row.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  onChange: {
    type: false,
    action: 'value-changed',
    description:
      'Fires when the selected day changes (RAC contract — receives the new `DateValue`).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
} as const;

export const calendarExcludeFromArgs = defineExcludeFromArgs([
  'value',
  'defaultValue',
  'minValue',
  'maxValue',
  'isDateUnavailable',
  'focusedValue',
  'defaultFocusedValue',
  'onFocusChange',
  'pageBehavior',
  'firstDayOfWeek',
  'visibleDuration',
  'autoFocus',
  'highlightedDates',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'translate',
  'slot',
  'data-rac',
  'children',
  'className',
] as const);
