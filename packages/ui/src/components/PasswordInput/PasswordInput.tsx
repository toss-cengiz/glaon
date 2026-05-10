// Glaon PasswordInput — thin wrap over `<Input variant='default'>`
// (#469). The kit `Input` already renders an Eye / EyeOff visibility
// toggle when `type='password'`; PasswordInput's job is to:
//
//   - bake in `type='password'` so consumers don't pass it manually,
//   - expose a cleaner prop API for the auth flows (`error` collapses
//     to `isInvalid` + `hint`),
//   - default `autoComplete` to a meaningful value (`current-password`
//     for sign-in, override via prop for `new-password` on sign-up /
//     password-reset forms).
//
// Per CLAUDE.md's UUI Source Rule: the visual is the kit's; this
// wrapper is the brand-controlled prop contract that the auth screens
// (#470, #471, #472) consume so they don't reach into the kit
// directly.

import type { FocusEventHandler, ReactNode, Ref } from 'react';

import { Input, type InputSize } from '../Input';

export type PasswordInputAutoComplete = 'current-password' | 'new-password' | 'off';

export interface PasswordInputProps {
  /** Label text rendered above the input. */
  label?: string;
  /** Placeholder text inside the input. */
  placeholder?: string;
  /**
   * Inline helper copy rendered under the input. Suppressed when
   * `error` is set (the error message takes its place).
   */
  hint?: ReactNode;
  /**
   * Inline error message. When set, the input is rendered with the
   * invalid state and the message replaces `hint`.
   */
  error?: ReactNode;
  /**
   * Input size (matches `<Input>`).
   * @default 'md'
   */
  size?: InputSize;
  /**
   * Browser auto-complete hint. Sign-in forms should use
   * `current-password`; sign-up / password-reset forms should use
   * `new-password` so password managers offer to save the new value.
   * @default 'current-password'
   */
  autoComplete?: PasswordInputAutoComplete;
  /** Controlled value. */
  value?: string;
  /** Initial uncontrolled value. */
  defaultValue?: string;
  /** Form field name. */
  name?: string;
  /** Explicit DOM id (defaults to a React-generated unique id). */
  id?: string;
  /** Called on every value change with the new string. */
  onChange?: (value: string) => void;
  onBlur?: FocusEventHandler;
  onFocus?: FocusEventHandler;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  /** Forwarded to the inner `<input>` element. */
  inputRef?: Ref<HTMLInputElement>;
}

export function PasswordInput({
  label,
  placeholder,
  hint,
  error,
  size = 'md',
  autoComplete = 'current-password',
  value,
  defaultValue,
  name,
  id,
  onChange,
  onBlur,
  onFocus,
  isRequired,
  isDisabled,
  isReadOnly,
  inputRef,
}: PasswordInputProps) {
  const isInvalid = error !== undefined && error !== null && error !== false;

  // Build the props bag conditionally so we don't hand the underlying
  // `<Input>` an explicit `undefined` for any optional prop — the
  // package compiles with `exactOptionalPropertyTypes: true`.
  const props: Record<string, unknown> = {
    type: 'password',
    variant: 'default',
    size,
    isInvalid,
  };
  if (label !== undefined) props.label = label;
  if (placeholder !== undefined) props.placeholder = placeholder;
  if (isInvalid) props.hint = error;
  else if (hint !== undefined) props.hint = hint;
  if (value !== undefined) props.value = value;
  if (defaultValue !== undefined) props.defaultValue = defaultValue;
  if (name !== undefined) props.name = name;
  if (id !== undefined) props.id = id;
  if (onChange !== undefined) props.onChange = onChange;
  if (onBlur !== undefined) props.onBlur = onBlur;
  if (onFocus !== undefined) props.onFocus = onFocus;
  if (isRequired === true) props.isRequired = true;
  if (isDisabled === true) props.isDisabled = true;
  if (isReadOnly === true) props.isReadOnly = true;
  if (inputRef !== undefined) props.inputRef = inputRef;

  // The kit reads `autoComplete` off the underlying `<input>`; we
  // pipe it through the kit's pass-through bag (`Input`'s
  // `DefaultInput` forwards every non-Glaon prop verbatim).
  props.autoComplete = autoComplete;

  return <Input {...props} />;
}
