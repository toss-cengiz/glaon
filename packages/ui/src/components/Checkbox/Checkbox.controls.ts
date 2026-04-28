// `Checkbox.controls.ts` — single source of truth for Checkbox's
// variant matrix. Story (`Checkbox.stories.tsx`) imports the spec and
// spreads it into `meta.args` / `meta.argTypes`; MDX docs
// (`Checkbox.mdx`) reads the same spec via `<Controls />`.
//
// Note on selection-state args: RAC `<Checkbox>` switches into
// controlled mode the moment `isSelected` / `isIndeterminate` /
// `isReadOnly` / `isRequired` is present (even when `false`). To keep
// the controls panel surfacing those props as boolean knobs without
// freezing the runtime checkbox, the entries omit `default` — they
// appear in `argTypes` but stay out of `args`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md'] as const;

export const checkboxControls = {
  label: {
    type: 'text',
    default: 'I agree to the terms',
    description:
      'Visible label rendered to the right of the checkbox. Always provide one — labels satisfy axe `label` and pair the control with assistive tech automatically.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  hint: {
    type: 'text',
    description:
      'Helper text rendered below the label. Doubles as the error message when `isInvalid` is true (the kit re-styles it red and adds `aria-describedby`).',
    category: 'Content',
  } satisfies ControlSpec<string>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'sm',
    description:
      'Visual scale. `sm` (default) for forms and dense lists, `md` for hero / focal-point checkboxes (consent flows, settings groups).',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Block all interaction and dim the control. The native `disabled` attribute is forwarded so axe and assistive tech treat the checkbox as inert.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isSelected: {
    type: 'boolean',
    description:
      'Controlled selection state. Setting this prop puts the checkbox in controlled mode — pair with `onChange` to manage state outside.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isIndeterminate: {
    type: 'boolean',
    description:
      'Render the mixed-state glyph (a horizontal bar instead of a check). Use for "select all" headers when some but not all children are checked.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isReadOnly: {
    type: 'boolean',
    description:
      'Field is focusable but not toggleable. Prefer over `isDisabled` when the value should remain accessible to screen readers and copy/paste.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isRequired: {
    type: 'boolean',
    description:
      'Mark the checkbox as required for form submission. Forwards `aria-required="true"` to the underlying input.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  isInvalid: {
    type: 'boolean',
    description:
      'Surface validation error styling (red border + ring). Pair with a `hint` to describe the error; the kit wires `aria-invalid` + `aria-describedby` automatically.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  defaultSelected: {
    type: 'boolean',
    description:
      'Initial selection for uncontrolled usage. Leave `isSelected` undefined when using this so RAC manages state internally.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  name: {
    type: 'text',
    description:
      'Form field name forwarded to the native input — required for native form submission.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  value: {
    type: 'text',
    description:
      'Form field value forwarded when the checkbox is selected (default: `"on"`). Distinct from `isSelected` — this is the submitted payload.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  onChange: {
    type: false,
    action: 'changed',
    description:
      'Fires when the selection state changes (RAC `onChange` contract — receives the new boolean).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onBlur: {
    type: false,
    action: 'blurred',
    description: 'Fires when focus leaves the checkbox.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onFocus: {
    type: false,
    action: 'focused',
    description: 'Fires when focus enters the checkbox.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  ref: {
    type: false,
    description: 'Forwarded ref to the kit `<Checkbox>` wrapper element.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
} as const;

// RAC-forwarded props that aren't useful as Storybook knobs but flow
// through type-checking; covered by the F6 prop-coverage gate.
export const checkboxExcludeFromArgs = defineExcludeFromArgs([
  'autoFocus',
  'children',
  'inputRef',
  'validate',
  'validationBehavior',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'aria-controls',
  'excludeFromTabOrder',
  'form',
  'translate',
  'slot',
  'data-rac',
] as const);
