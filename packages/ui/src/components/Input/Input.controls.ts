// `Input.controls.ts` — single source of truth for Input's variant
// matrix. Story (`Input.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Input.mdx`)
// reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';

const sizeOptions = ['sm', 'md', 'lg'] as const;
const typeOptions = ['text', 'email', 'password', 'number', 'tel', 'url'] as const;
const variantOptions = [
  'default',
  'leading-text',
  'trailing-button',
  'leading-dropdown',
  'trailing-dropdown',
  'payment',
  'tags-inner',
] as const;
type TagSeparator = 'Enter' | ',' | ' ';

export const inputControls = {
  variant: {
    type: 'select',
    options: variantOptions,
    default: 'default',
    description:
      "Layout discriminator. `default` is the kit input verbatim. The other six swap slot composition (leading text / trailing button / leading-or-trailing dropdown / payment masking / tags-inner chips) while sharing the same surface ring. Variant-only props (`leadingText`, `dropdownOptions`, `trailingButtonLabel`, `tags`, …) are ignored when they don't apply.",
    category: 'Style',
  } satisfies ControlSpec<(typeof variantOptions)[number]>,
  label: {
    type: 'text',
    default: 'Email address',
    description:
      'Visible label rendered above the field. Always provide one — labels are the primary affordance for axe `label` and `aria-input-field-name`. For visually hidden labels, prefer `aria-label` instead.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  placeholder: {
    type: 'text',
    default: 'olivia@untitledui.com',
    description:
      'Hint text shown when the field is empty. Never use placeholder as a substitute for a label — it disappears on focus and fails axe `placeholder-only`.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  hint: {
    type: 'text',
    description:
      'Helper text rendered below the field. Doubles as the error message when `isInvalid` is true (the kit re-styles it red and adds `aria-describedby`).',
    category: 'Content',
  } satisfies ControlSpec<string>,
  tooltip: {
    type: 'text',
    description:
      'Inline tooltip trigger appended to the label (info icon). Use for short clarifying copy when `hint` would clutter the layout.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description:
      'Visual scale. `sm` for compact toolbars / table cells, `md` (default) for forms, `lg` for hero sign-up / search affordances.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  type: {
    type: 'inline-radio',
    options: typeOptions,
    default: 'text',
    description:
      "Native HTML input type. `password` activates the kit's built-in show/hide toggle; `email` / `tel` / `url` / `number` set the appropriate mobile keyboard.",
    category: 'Behavior',
  } satisfies ControlSpec<(typeof typeOptions)[number]>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Block all interaction and dim the field. The native `disabled` attribute is forwarded so axe and assistive tech treat the field as inert.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isReadOnly: {
    type: 'boolean',
    default: false,
    description:
      'Field is selectable + copyable but the value cannot be edited. Prefer over `isDisabled` when the value should remain accessible to screen readers and copy/paste.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isRequired: {
    type: 'boolean',
    default: false,
    description:
      'Mark the field as required (renders an indicator next to the label and forwards `aria-required`). Use `hideRequiredIndicator` to drop the visual marker on dense forms while keeping the a11y semantics.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  isInvalid: {
    type: 'boolean',
    default: false,
    description:
      'Surface validation error styling (red border + ring). Pair with a `hint` to describe the error; the kit wires `aria-invalid` + `aria-describedby` automatically.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  hideRequiredIndicator: {
    type: 'boolean',
    default: false,
    description:
      'Hide the visual `*` next to the label even when `isRequired` is true. Keep `isRequired` set so the a11y contract still reports the field as required.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  icon: {
    type: 'select',
    options: Object.keys(storybookIcons),
    mapping: storybookIcons,
    description:
      'Leading icon glyph rendered inside the field. Use kit `@untitledui/icons` exports; the kit handles sizing + colour. Pair with a meaningful `aria-label` if the icon conveys meaning beyond the label.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  shortcut: {
    type: 'text',
    description:
      'Keyboard-shortcut hint rendered on the trailing edge (e.g. `⌘ K` for search). Decorative — register the actual key handler at the page level.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  value: {
    type: 'text',
    description:
      'Controlled value. Pair with `onChange` to manage state outside the input. Leave undefined for uncontrolled usage with `defaultValue`.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  defaultValue: {
    type: 'text',
    description:
      'Initial value for uncontrolled usage. The kit forwards this to the native `<input defaultValue>`.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  name: {
    type: 'text',
    description:
      'Form field name forwarded to the native input — required for native form submission.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  onChange: {
    type: false,
    action: 'changed',
    description:
      'Fires on every keystroke with the new string value (RAC TextField onChange contract).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onBlur: {
    type: false,
    action: 'blurred',
    description: 'Fires when focus leaves the field — typical place to run validation.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onFocus: {
    type: false,
    action: 'focused',
    description: 'Fires when focus enters the field.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  inputClassName: {
    type: false,
    description: 'Tailwind override hook for the native `<input>` element itself.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  iconClassName: {
    type: false,
    description: 'Tailwind override hook for the leading icon slot.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  wrapperClassName: {
    type: false,
    description: 'Tailwind override hook for the input + icon wrapper (between label and hint).',
    category: 'Style',
  } satisfies ControlSpec<string>,
  tooltipClassName: {
    type: false,
    description: 'Tailwind override hook for the inline label tooltip trigger.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  ref: {
    type: false,
    description: 'Forwarded ref to the kit `<TextField>` wrapper.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  groupRef: {
    type: false,
    description: 'Forwarded ref to the input group element (input + leading icon + shortcut).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  inputRef: {
    type: false,
    description:
      'Forwarded ref to the inner `<input>` element (Glaon variants only — the kit Input variant uses `ref` for this).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  leadingText: {
    type: 'text',
    description:
      "Static prefix shown inside the surface, before the input (e.g. `https://`, `+90`). Only honoured when `variant='leading-text'`.",
    category: 'Content',
  } satisfies ControlSpec<string>,
  dropdownOptions: {
    type: 'object',
    description:
      "Option list (`{ value, label }[]`) for the inline `<select>` slot. Used by `variant='leading-dropdown'` and `variant='trailing-dropdown'`.",
    category: 'Content',
  } satisfies ControlSpec<{ value: string; label: string }[]>,
  dropdownValue: {
    type: 'text',
    description: 'Controlled dropdown value. Pair with `onDropdownChange`.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  defaultDropdownValue: {
    type: 'text',
    description:
      'Initial dropdown value (uncontrolled). Defaults to the first option when omitted.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  onDropdownChange: {
    type: false,
    action: 'dropdown-changed',
    description: 'Fires when the inline `<select>` value changes.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  dropdownAriaLabel: {
    type: 'text',
    description:
      'Accessible label for the inline `<select>` (e.g. "Country code"). Required when the visible label belongs to the input rather than the dropdown.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  trailingButtonLabel: {
    type: 'text',
    description:
      "Inline submit-style button label (e.g. `Send`, `Apply`, `Search`). Only honoured when `variant='trailing-button'`.",
    category: 'Content',
  } satisfies ControlSpec<string>,
  onTrailingButtonPress: {
    type: false,
    action: 'trailing-button-pressed',
    description: 'Inline button click handler.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  trailingButtonIconLeading: {
    type: 'select',
    options: Object.keys(storybookIcons),
    mapping: storybookIcons,
    description: 'Optional leading icon for the inline button.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  onPaymentBrandDetected: {
    type: false,
    action: 'brand-detected',
    description:
      "Fires with the auto-detected card brand (`'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'`) for `variant='payment'`. Use to render a brand logo elsewhere or customise surrounding form copy.",
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  tags: {
    type: 'object',
    description: "Controlled chip list (`variant='tags-inner'`). Pair with `onTagsChange`.",
    category: 'Behavior',
  } satisfies ControlSpec<string[]>,
  defaultTags: {
    type: 'object',
    description:
      'Initial chip list for uncontrolled `tags-inner` usage. JSON array literal in the controls panel.',
    category: 'Behavior',
  } satisfies ControlSpec<string[]>,
  onTagsChange: {
    type: false,
    action: 'tags-changed',
    description: 'Fires with the next chip list when chips are added or removed.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  addTagOn: {
    type: 'object',
    default: ['Enter', ','] satisfies TagSeparator[],
    description:
      "Keys that confirm the current text into a chip. Defaults to `['Enter', ',']`. Mirror's `<Textarea variant='tags-inner'>` configuration.",
    category: 'Behavior',
  } satisfies ControlSpec<TagSeparator[]>,
} as const;

// react-aria-components forwards a number of props from RAC TextField
// (`autoFocus`, `validate`, `validationBehavior`, …) that we don't
// surface as Storybook controls; the F6 prop-coverage gate accepts
// them via this allowlist instead.
export const inputExcludeFromArgs = defineExcludeFromArgs([
  'autoFocus',
  'validate',
  'validationBehavior',
  'inputMode',
  'minLength',
  'maxLength',
  'pattern',
  'autoComplete',
  'enterKeyHint',
  'spellCheck',
  'autoCorrect',
  'autoCapitalize',
  'form',
  'translate',
  'slot',
  'children',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'data-rac',
] as const);
