// `DatePicker.controls.ts` — single source of truth for DatePicker's
// variant matrix. Story (`DatePicker.stories.tsx`) imports the spec
// and spreads it into `meta.args` / `meta.argTypes`; MDX docs
// (`DatePicker.mdx`) reads the same spec via `<Controls />`.
//
// The kit's `DatePicker` extends RAC `AriaDatePickerProps<DateValue>`
// — `value` / `defaultValue` / `onChange` / `isDisabled` /
// `isInvalid` / `minValue` / `maxValue` / `granularity` / locale
// adapters all flow through. Surfacing the full set as Storybook
// knobs would be useless noise; we expose the practical subset.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md', 'lg', 'xl'] as const;

export const datePickerControls = {
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'sm',
    description:
      'Trigger button scale. Mirrors the kit Button sizes (`sm` / `md` / `lg` / `xl`); tune to match the surrounding form-row density.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Disable the trigger and the popover. Use for read-only summaries or when the date is locked by upstream state.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isReadOnly: {
    type: 'boolean',
    default: false,
    description:
      'Read-only — the trigger remains focusable but the calendar grid suppresses selection. Useful for value-display rows.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isRequired: {
    type: 'boolean',
    default: false,
    description:
      'Forwards `aria-required="true"`. Pair with form labels that mark the field required.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  isInvalid: {
    type: 'boolean',
    default: false,
    description:
      'Flips the trigger into the invalid state and forwards `aria-invalid="true"`. Combine with a sibling error message.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  shouldCloseOnSelect: {
    type: 'boolean',
    default: false,
    description:
      "Close the popover as soon as a date is picked (RAC default). Glaon's wrap defers to Apply / Cancel, so the kit ships with this set to `false`.",
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  onChange: {
    type: false,
    action: 'value-changed',
    description:
      'Fires when the selected date changes (RAC contract — receives the new `DateValue`).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onApply: {
    type: false,
    action: 'apply-clicked',
    description: 'Fires when the popover Apply CTA is clicked. Use to confirm the value upstream.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onCancel: {
    type: false,
    action: 'cancel-clicked',
    description:
      'Fires when the popover Cancel CTA is clicked. The popover always closes either way.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
} as const;

// RAC-forwarded props that aren't useful as Storybook knobs; covered
// by the F6 prop-coverage gate.
export const datePickerExcludeFromArgs = defineExcludeFromArgs([
  'value',
  'defaultValue',
  'minValue',
  'maxValue',
  'isDateUnavailable',
  'placeholderValue',
  'hourCycle',
  'granularity',
  'hideTimeZone',
  'shouldForceLeadingZeros',
  'pageBehavior',
  'firstDayOfWeek',
  'autoFocus',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'translate',
  'slot',
  'data-rac',
  'name',
  'form',
  'validate',
  'validationBehavior',
  'children',
  'className',
] as const);
