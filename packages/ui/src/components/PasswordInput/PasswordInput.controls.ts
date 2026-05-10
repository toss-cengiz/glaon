// `PasswordInput.controls.ts` — single source of truth for
// PasswordInput's variant matrix. Story imports the spec; MDX docs
// reads the same spec via `<Controls />`. Slot props (`hint`, `error`)
// accept ReactNode but the controls panel renders them as `text`
// (Storybook coerces the string into a text node), which keeps the
// docs page readable.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md', 'lg'] as const;
const autoCompleteOptions = ['current-password', 'new-password', 'off'] as const;

export const passwordInputControls = {
  label: {
    type: 'text',
    default: 'Password',
    description: 'Label rendered above the input. Pair with the form context (Sign in / Sign up).',
    category: 'Content',
  } satisfies ControlSpec<string>,
  placeholder: {
    type: 'text',
    default: '••••••••',
    description:
      'Placeholder text inside the input — typically a row of bullets to hint the masked nature.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  hint: {
    type: 'text',
    description:
      'Inline helper copy under the input (e.g. password rules: "Must be at least 8 characters."). Suppressed when `error` is set.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  error: {
    type: 'text',
    description:
      'Inline error message. When set, the input is rendered in the invalid state and the message replaces `hint`.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description: 'Visual size — pulled from the underlying `<Input>` primitive.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  autoComplete: {
    type: 'inline-radio',
    options: autoCompleteOptions,
    default: 'current-password',
    description:
      'Browser autofill hint. Use `current-password` for Sign in (password manager fills the existing password) and `new-password` for Sign up / Forgot-password reset (password manager offers to save the new value). `off` disables autofill.',
    category: 'A11y',
  } satisfies ControlSpec<(typeof autoCompleteOptions)[number]>,
  isRequired: {
    type: 'boolean',
    default: false,
    description: 'Marks the field as required (visual asterisk + `aria-required`).',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description: 'Disables the input and the visibility toggle.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isReadOnly: {
    type: 'boolean',
    default: false,
    description: 'Renders the input as read-only — the visibility toggle still works.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  onChange: {
    type: false,
    action: 'changed',
    description: 'Fires on every value change with the new string.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
} as const;

export const passwordInputExcludeFromArgs = defineExcludeFromArgs([
  'value',
  'defaultValue',
  'name',
  'id',
  'onBlur',
  'onFocus',
  'inputRef',
] as const);
