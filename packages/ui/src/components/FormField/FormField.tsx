// Glaon FormField — application primitive that wraps a `<label>`,
// a control slot, and an optional hint / error message into one
// labelled row (#469).
//
// FormField is intentionally lightweight: it doesn't render an input,
// it doesn't manage state, and it doesn't fetch (CLAUDE.md
// Component Data-Fetching Boundary). Its job is the visual scaffold
// + the `aria-describedby` glue that ties the control to its hint
// or error message. It's the right wrapper when the control is NOT
// the kit `<Input>` (which already renders its own label / hint) —
// e.g. a checkbox group, an HA URL row with custom helper, or a
// `<select>` from outside the kit.

import { useId, type ReactNode } from 'react';

import { Label } from '../base/input/label';
import { HintText } from '../base/input/hint-text';

export type FormFieldSize = 'sm' | 'md';

export interface FormFieldProps {
  /** Label rendered above the control. */
  label: string;
  /**
   * `id` of the control inside `children`. Bound to the rendered
   * `<label htmlFor>`; required so the label click/tap focuses the
   * control.
   */
  htmlFor: string;
  /** The control element (Input, Select, Checkbox group, …). */
  children: ReactNode;
  /**
   * Inline error message. When set, the field is rendered in the
   * invalid state (red helper text) and the message replaces `hint`.
   * The control's `aria-describedby` should reference the value
   * exposed via `errorId` / `hintId` (see `controlIds`).
   */
  error?: ReactNode;
  /** Inline helper copy. Suppressed when `error` is set. */
  hint?: ReactNode;
  /** Marks the field as required (visual asterisk on the label). */
  isRequired?: boolean;
  /**
   * Visual size — drives the `<HintText>` size.
   * @default 'md'
   */
  size?: FormFieldSize;
}

/**
 * Companion helper: derive the ids the control should reference
 * from its `aria-describedby` so screen readers announce the right
 * message. Use `useFormFieldDescriptors(htmlFor)` inside the control
 * and pass the returned ids to `<input aria-describedby={...}>`.
 */
export function useFormFieldDescriptors(htmlFor: string): {
  hintId: string;
  errorId: string;
  describedBy: (hasError: boolean, hasHint: boolean) => string | undefined;
} {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  return {
    hintId,
    errorId,
    describedBy: (hasError, hasHint) => {
      if (hasError) return errorId;
      if (hasHint) return hintId;
      return undefined;
    },
  };
}

export function FormField({
  label,
  htmlFor,
  children,
  error,
  hint,
  isRequired = false,
  size = 'md',
}: FormFieldProps) {
  // Generate stable ids that callers can match against their own
  // `aria-describedby` — derived from `htmlFor` so consumers don't
  // need to thread the ids through manually.
  const fallbackId = useId();
  const fieldId = htmlFor.length > 0 ? htmlFor : fallbackId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const isInvalid = error !== undefined && error !== null && error !== false;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId} isRequired={isRequired}>
        {label}
      </Label>
      {children}
      {isInvalid ? (
        <HintText id={errorId} isInvalid size={size}>
          {error}
        </HintText>
      ) : hint !== undefined ? (
        <HintText id={hintId} size={size}>
          {hint}
        </HintText>
      ) : null}
    </div>
  );
}
