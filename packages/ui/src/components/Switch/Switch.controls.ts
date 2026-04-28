// `Switch.controls.ts` — single source of truth for Switch's variant
// matrix. Story (`Switch.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Switch.mdx`)
// reads the same spec via `<Controls />`.
//
// Note on `isSelected`: RAC `<Switch>` switches into controlled mode
// the moment `isSelected` is present in props (even when `false`).
// To keep the controls panel surfacing the prop without freezing the
// runtime switch, the entry omits `default` — it appears in
// `argTypes` but stays out of `args`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md'] as const;

export const switchControls = {
  label: {
    type: 'text',
    default: 'Enable notifications',
    description:
      'Visible label rendered next to the toggle. Always provide one — labels satisfy axe `label` and pair the control with assistive tech automatically.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  hint: {
    type: 'text',
    description:
      'Helper text rendered below the label. Use to clarify what the toggle does or note any side-effects ("Takes effect immediately.").',
    category: 'Content',
  } satisfies ControlSpec<string>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'sm',
    description:
      'Visual scale. `sm` (default) for dense settings panels, `md` for hero / focal-point toggles in card layouts.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  slim: {
    type: 'boolean',
    default: false,
    description:
      'Render the slim track variant — narrower height, smaller knob. Use when toggles must blend into typography-dense rows (table cells, list items).',
    category: 'Style',
  } satisfies ControlSpec<boolean>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Block all interaction and dim the control. The native `disabled` attribute is forwarded so axe and assistive tech treat the switch as inert.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isSelected: {
    type: 'boolean',
    description:
      'Controlled selection state. Setting this prop puts the switch in controlled mode — pair with `onChange` to manage state outside.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isReadOnly: {
    type: 'boolean',
    description:
      'Switch is focusable but not toggleable. Prefer over `isDisabled` when the value should remain accessible to screen readers.',
    category: 'Behavior',
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
      'Form field value forwarded when the switch is on (default: `"on"`). Distinct from `isSelected` — this is the submitted payload.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  onChange: {
    type: false,
    action: 'changed',
    description:
      'Fires when the switch toggles (RAC `onChange` contract — receives the new boolean).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onBlur: {
    type: false,
    action: 'blurred',
    description: 'Fires when focus leaves the switch.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onFocus: {
    type: false,
    action: 'focused',
    description: 'Fires when focus enters the switch.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

// RAC-forwarded props that aren't useful as Storybook knobs; covered
// by the F6 prop-coverage gate.
export const switchExcludeFromArgs = defineExcludeFromArgs([
  'autoFocus',
  'children',
  'inputRef',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'aria-controls',
  'excludeFromTabOrder',
  'form',
  'translate',
  'slot',
  'data-rac',
] as const);
