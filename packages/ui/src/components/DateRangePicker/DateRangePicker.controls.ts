// `DateRangePicker.controls.ts` — single source of truth for
// DateRangePicker's variant matrix. Story imports the spec and
// spreads it into `meta.args` / `meta.argTypes`; MDX docs reads
// the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md', 'lg', 'xl'] as const;

export const dateRangePickerControls = {
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'sm',
    description:
      'Trigger button scale. Mirrors the kit Button sizes; tune to match the surrounding form-row density.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Disable the trigger and the popover. Use for read-only dashboards or locked filters.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isReadOnly: {
    type: 'boolean',
    default: false,
    description:
      'Read-only — the trigger remains focusable but the calendar grid suppresses selection.',
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
  onChange: {
    type: false,
    action: 'value-changed',
    description:
      'Fires when the selected range changes (RAC contract — receives `{ start, end }`).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onApply: {
    type: false,
    action: 'apply-clicked',
    description: 'Fires when the popover Apply CTA is clicked. Use to commit the range upstream.',
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

export const dateRangePickerExcludeFromArgs = defineExcludeFromArgs([
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
  'allowsNonContiguousRanges',
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
  'startName',
  'endName',
  'form',
  'validate',
  'validationBehavior',
  'children',
  'className',
  'shouldCloseOnSelect',
] as const);
