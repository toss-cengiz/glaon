// `RadioGroup.controls.ts` — single source of truth for the
// Glaon RadioGroup wrap's prop surface. The story
// (`RadioGroup.stories.tsx`) imports the spec and spreads it into
// `meta.args` / `meta.argTypes`; MDX docs (`RadioGroup.mdx`) reads
// the same spec via `<Controls />`.
//
// The wrap adds form-level props on top of the kit `RadioGroup`:
// label, description, errorMessage, isRequired, tooltip, plus a
// visual `orientation` flag the kit doesn't surface.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const orientationOptions = ['vertical', 'horizontal'] as const;
const sizeOptions = ['sm', 'md'] as const;

export const radioGroupControls = {
  label: {
    type: 'text',
    default: 'Notification channel',
    description:
      'Visible group label rendered via RAC `<Label>`. Set this whenever the group has a clear question — anonymous groups (`aria-label` only) hurt screen-reader UX.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  description: {
    type: 'text',
    description:
      'Helper text rendered below the radios via RAC `<Text slot="description">`. Use to clarify defaults, ramifications, or scope.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  errorMessage: {
    type: 'text',
    description:
      'Error message rendered below the radios via RAC `<FieldError>`. Setting this auto-flips the group into the invalid state (`aria-invalid="true"`) and replaces the description.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  tooltip: {
    type: 'text',
    description: 'Tooltip text shown next to the label via the kit `<Label tooltip>` slot.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  orientation: {
    type: 'inline-radio',
    options: orientationOptions,
    default: 'vertical',
    description:
      'Layout direction. `horizontal` re-flows the radios as a wrapping row; the RAC keyboard contract switches arrow-key axes accordingly.',
    category: 'Style',
  } satisfies ControlSpec<(typeof orientationOptions)[number]>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'sm',
    description:
      'Radio scale. Propagates via `RadioGroupContext` so each child `<Radio>` reads it from context — set on the group, not on individual radios.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  defaultValue: {
    type: 'text',
    description:
      'Initial selected value for uncontrolled usage. Pair with `value` + `onChange` for controlled groups.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  value: {
    type: 'text',
    description:
      'Controlled selected value. Pair with `onChange` to manage state outside the component.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Disable the entire group. Individual radios can still set `isDisabled` for finer control.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isReadOnly: {
    type: 'boolean',
    default: false,
    description: 'Read-only — the value is fixed but the group remains focusable.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isRequired: {
    type: 'boolean',
    default: false,
    description:
      'Mark the group as required. Renders the asterisk next to the label and forwards `aria-required="true"`.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  isInvalid: {
    type: 'boolean',
    default: false,
    description:
      'Manually flip the invalid state. Auto-set when `errorMessage` is provided — usually you only set one or the other.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  name: {
    type: 'text',
    description:
      'Form field name forwarded to the underlying native input — required when posting the group as part of a `<form>`.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  onChange: {
    type: false,
    action: 'value-changed',
    description:
      'Fires when the selected value changes (RAC contract — receives the new string value).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onBlur: {
    type: false,
    action: 'blurred',
    description: 'Fires when focus leaves the group.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onFocus: {
    type: false,
    action: 'focused',
    description: 'Fires when focus enters the group.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onFocusChange: {
    type: false,
    action: 'focus-changed',
    description: 'Fires whenever the focus state of the group toggles (RAC contract).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onHoverStart: {
    type: false,
    action: 'hover-started',
    description: 'Fires when the pointer enters the group.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onHoverEnd: {
    type: false,
    action: 'hover-ended',
    description: 'Fires when the pointer leaves the group.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onHoverChange: {
    type: false,
    action: 'hover-changed',
    description: 'Fires whenever the hover state of the group toggles (RAC contract).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer RadioGroup wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  children: {
    type: false,
    description:
      'Compose with one or more `<Radio>` (default flat row) or `<Radio.Card>` (bordered tile). Mixing both inside the same group is allowed but unusual.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
} as const;

// RAC-forwarded props that aren't useful as Storybook knobs; covered
// by the F6 prop-coverage gate.
export const radioGroupExcludeFromArgs = defineExcludeFromArgs([
  'autoFocus',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'translate',
  'slot',
  'data-rac',
  'ref',
  'id',
  'style',
  'dir',
  'form',
  'validate',
  'validationBehavior',
] as const);
