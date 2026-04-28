// `Radio.controls.ts` — single source of truth for Radio's variant
// matrix. Story (`Radio.stories.tsx`) imports the spec and spreads it
// into `meta.args` / `meta.argTypes`; MDX docs (`Radio.mdx`) reads
// the same spec via `<Controls />`.
//
// `Radio` always renders inside a `<RadioGroup>`. The group owns
// `size`, `defaultValue` / `value`, `onChange`, and validation state;
// individual `Radio` instances own `label`, `value`, `hint`, and
// `isDisabled`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md'] as const;

export const radioControls = {
  label: {
    type: 'text',
    default: 'Email notifications',
    description:
      'Visible label rendered to the right of the radio dot. Always provide one — labels satisfy axe `label` and pair the control with assistive tech automatically.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  hint: {
    type: 'text',
    description:
      'Helper text rendered below the label. Use to clarify what the option means (e.g. "A weekly digest." next to "Email").',
    category: 'Content',
  } satisfies ControlSpec<string>,
  value: {
    type: 'text',
    default: 'email',
    description:
      'Form value forwarded to the parent `<RadioGroup>` when this option is selected. Distinct from the visible `label`.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'sm',
    description:
      'Visual scale. Mirrors the parent `<RadioGroup>` size; setting it on a single `Radio` overrides the group default.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Block interaction on this option only. The parent group remains operable; users can still pick a different option.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  onBlur: {
    type: false,
    action: 'blurred',
    description: 'Fires when focus leaves this Radio.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onFocus: {
    type: false,
    action: 'focused',
    description: 'Fires when focus enters this Radio.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onFocusChange: {
    type: false,
    action: 'focus-changed',
    description:
      'Fires whenever the focused state of this Radio toggles (RAC contract — receives the new boolean).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onHoverChange: {
    type: false,
    action: 'hover-changed',
    description: 'Fires whenever the hovered state of this Radio toggles (RAC contract).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  ref: {
    type: false,
    description: 'Forwarded ref to the kit `<Radio>` wrapper element.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  inputRef: {
    type: false,
    description: 'Forwarded ref to the underlying native `<input type="radio">` element.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
} as const;

// RAC-forwarded props that aren't useful as Storybook knobs; covered
// by the F6 prop-coverage gate.
export const radioExcludeFromArgs = defineExcludeFromArgs([
  'autoFocus',
  'children',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'excludeFromTabOrder',
  'translate',
  'slot',
  'data-rac',
] as const);
