// `Select.controls.ts` — single source of truth for Select's variant
// matrix. Story (`Select.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Select.mdx`)
// reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md', 'lg'] as const;

export const selectControls = {
  label: {
    type: 'text',
    default: 'Country',
    description:
      'Visible label rendered above the trigger. Always provide one — labels satisfy axe `label` and pair the Select with assistive tech automatically.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  hint: {
    type: 'text',
    description:
      'Helper text rendered below the trigger. Doubles as the error message when `isInvalid` is true (the kit re-styles it red and adds `aria-describedby`).',
    category: 'Content',
  } satisfies ControlSpec<string>,
  placeholder: {
    type: 'text',
    default: 'Select a country',
    description:
      'Hint text shown when no option is selected. Never use placeholder as a substitute for a label — use the `label` prop instead.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  tooltip: {
    type: 'text',
    description:
      'Inline tooltip trigger appended to the label (info icon). Use for short clarifying copy when `hint` would crowd the field.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description:
      'Visual scale. `sm` for compact toolbars / table cells, `md` (default) for forms, `lg` for hero affordances.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Block all interaction and dim the trigger. The kit forwards `aria-disabled` so axe and assistive tech treat the Select as inert.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isInvalid: {
    type: 'boolean',
    default: false,
    description:
      'Surface validation error styling (red border + ring on the trigger). Pair with a `hint` to describe the error; the kit wires `aria-invalid` + `aria-describedby` automatically.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  isRequired: {
    type: 'boolean',
    default: false,
    description:
      'Mark the field as required (renders an indicator next to the label and forwards `aria-required`). Use `hideRequiredIndicator` to drop the visual marker on dense forms while keeping the a11y semantics.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  hideRequiredIndicator: {
    type: 'boolean',
    default: false,
    description:
      'Hide the visual `*` next to the label even when `isRequired` is true. Keep `isRequired` set so the a11y contract still reports the field as required.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  selectedKey: {
    type: 'text',
    description:
      'Controlled selection — the `id` of the currently selected `SelectItem`. Pair with `onSelectionChange` to manage state outside.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  defaultSelectedKey: {
    type: 'text',
    description:
      'Initial selection for uncontrolled usage — the `id` of the option to start selected. Leave `selectedKey` undefined when using this so RAC manages state internally.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  name: {
    type: 'text',
    description:
      'Form field name forwarded to the hidden native input — required for native form submission.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  onSelectionChange: {
    type: false,
    action: 'selection-changed',
    description: 'Fires when the selected option changes (RAC contract — receives the new key).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onOpenChange: {
    type: false,
    action: 'open-changed',
    description:
      'Fires when the popover opens or closes (RAC contract — receives the new boolean).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onBlur: {
    type: false,
    action: 'blurred',
    description: 'Fires when focus leaves the trigger.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onFocus: {
    type: false,
    action: 'focused',
    description: 'Fires when focus enters the trigger.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  items: {
    type: false,
    description:
      'Array of option objects (`{ id, label, … }`) rendered into the popover ListBox. Pair with `children` (a render function) for typed dynamic collections.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  children: {
    type: false,
    description:
      'Render function `(item) => <SelectItem id={item.id} label={item.label} />` — the kit drives RAC `<ListBox>` collection via this signature.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  icon: {
    type: false,
    description: 'Optional leading icon rendered inside the trigger button.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  popoverClassName: {
    type: false,
    description: 'Tailwind override hook for the popover surface that wraps the option list.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  ref: {
    type: false,
    description: 'Forwarded ref to the kit `<Select>` wrapper element.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
} as const;

// RAC-forwarded props that aren't useful as Storybook knobs but flow
// through type-checking; covered by the F6 prop-coverage gate.
export const selectExcludeFromArgs = defineExcludeFromArgs([
  'autoFocus',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'excludeFromTabOrder',
  'form',
  'translate',
  'slot',
  'data-rac',
  'menuTrigger',
  'shouldFlip',
  'disabledKeys',
  'validate',
  'validationBehavior',
  'isOpen',
  'defaultOpen',
  'autoComplete',
  'key',
] as const);
