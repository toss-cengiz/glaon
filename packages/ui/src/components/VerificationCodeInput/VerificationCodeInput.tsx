// Glaon VerificationCodeInput — OTP / SMS confirmation primitive that
// renders a configurable number of single-character cells side by
// side. Auto-advances focus on input, auto-retreats on Backspace,
// and accepts pasted full codes via the first cell. The kit ships no
// equivalent, so this falls under the UUI Source Rule's "no kit
// source" exception (CLAUDE.md). Surface vocabulary mirrors
// `<Input>` (rounded ring, focus / invalid affordances) so the
// component reads as part of the same family.
//
// Figma reference: Design System → Inputs → Verification code input
// field (https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=85-1269).
//
// Single-character cells with `inputmode="numeric"` so mobile
// keyboards open the digit pad. Each cell is a real `<input>` so
// keyboard nav, autofill (`autocomplete="one-time-code"`), and
// password managers all work without extra wiring. The full value
// flows back via `onChange` (joined string) and `onComplete` fires
// once every cell is filled.

import type { ChangeEvent, ClipboardEvent, FocusEvent, KeyboardEvent, Ref } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { HintText } from '../base/input/hint-text';
import { Label } from '../base/input/label';

export type VerificationCodeSize = 'sm' | 'md' | 'lg';

export interface VerificationCodeInputProps {
  /** Visible label rendered above the cell row. */
  label?: string;
  /** Helper text rendered below the row — re-styles red when `isInvalid`. */
  hint?: string;
  /** Visual scale. @default 'md' */
  size?: VerificationCodeSize;
  /**
   * Number of cells. Figma frame ships 4 / 6; any positive integer
   * works. Pasting a code longer than `digits` truncates to fit.
   * @default 6
   */
  digits?: number;
  /** Controlled full string value. Pair with `onChange`. */
  value?: string;
  /** Initial value (uncontrolled). */
  defaultValue?: string;
  /** Fires on every keystroke / paste with the joined string. */
  onChange?: (value: string) => void;
  /** Fires once every cell is filled (length === digits). */
  onComplete?: (value: string) => void;
  /** Surface validation error styling (red ring) on every cell. */
  isInvalid?: boolean;
  /** Block all interaction. */
  isDisabled?: boolean;
  /**
   * Accessible label for the cell row. Required — screen readers
   * announce this when the first cell receives focus.
   * @default 'Verification code'
   */
  ariaLabel?: string;
  /** Form field name forwarded to the hidden full-value input. */
  name?: string;
  /** Tailwind override hook for the wrapper. */
  className?: string;
  /** Forwarded ref to the wrapping `<div>`. */
  ref?: Ref<HTMLDivElement>;
}

const cellSizeStyles: Record<VerificationCodeSize, string> = {
  sm: 'h-12 w-12 text-lg',
  md: 'h-14 w-14 text-xl',
  lg: 'h-16 w-16 text-2xl',
};

function joinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

function pad(value: string, length: number): string[] {
  const cells: string[] = Array.from({ length }, () => '');
  for (let i = 0; i < Math.min(value.length, length); i += 1) {
    cells[i] = value[i] ?? '';
  }
  return cells;
}

export function VerificationCodeInput({
  label,
  hint,
  size = 'md',
  digits = 6,
  value: controlledValue,
  defaultValue,
  onChange,
  onComplete,
  isInvalid = false,
  isDisabled = false,
  ariaLabel = 'Verification code',
  name,
  className,
  ref,
}: VerificationCodeInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '');
  const isControlled = controlledValue !== undefined;
  const currentValue = (isControlled ? controlledValue : uncontrolledValue).slice(0, digits);
  const cells = pad(currentValue, digits);
  const cellRefs = useRef<(HTMLInputElement | null)[]>([]);
  const labelId = useId();
  const hintId = useId();

  const setValue = useCallback(
    (next: string) => {
      const trimmed = next.slice(0, digits);
      if (!isControlled) setUncontrolledValue(trimmed);
      onChange?.(trimmed);
      if (trimmed.length === digits) {
        onComplete?.(trimmed);
      }
    },
    [digits, isControlled, onChange, onComplete],
  );

  // Keep the rendered cell value in sync with the controlled value
  // even when the parent updates externally (e.g. autofill).
  useEffect(() => {
    cellRefs.current.forEach((node, index) => {
      if (node !== null) node.value = cells[index] ?? '';
    });
  }, [cells]);

  const focusCell = (index: number) => {
    const target = cellRefs.current[Math.min(Math.max(0, index), digits - 1)];
    target?.focus();
    target?.select();
  };

  const handleChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.currentTarget.value;
    // Most browsers keep the cell single-character thanks to maxLength;
    // when autofill / IME injects multiple characters, treat the input
    // as a full-code paste so digits flow into subsequent cells.
    if (raw.length > 1) {
      const merged = currentValue.slice(0, index) + raw.replace(/\D/g, '');
      setValue(merged);
      focusCell(index + raw.length);
      return;
    }
    const sanitised = raw.replace(/\D/g, '').slice(0, 1);
    const nextValue = currentValue.slice(0, index) + sanitised + currentValue.slice(index + 1);
    setValue(nextValue);
    if (sanitised.length === 1 && index < digits - 1) {
      focusCell(index + 1);
    }
  };

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      // If this cell already empty, retreat to the previous cell and
      // clear it — typical OTP UX.
      if ((cells[index] ?? '').length === 0 && index > 0) {
        event.preventDefault();
        const nextValue = currentValue.slice(0, index - 1) + currentValue.slice(index);
        setValue(nextValue);
        focusCell(index - 1);
      }
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusCell(index - 1);
    } else if (event.key === 'ArrowRight' && index < digits - 1) {
      event.preventDefault();
      focusCell(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '');
    if (pasted.length === 0) return;
    event.preventDefault();
    setValue(pasted.slice(0, digits));
    focusCell(Math.min(pasted.length, digits - 1));
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    // Select the cell content on focus so retyping replaces it
    // instead of appending — feels more natural than a blinking
    // caret next to a digit.
    event.currentTarget.select();
  };

  return (
    <div
      ref={ref}
      className={joinClasses(
        'flex h-max w-full flex-col items-start justify-start gap-1.5',
        className,
      )}
    >
      {label !== undefined && (
        <span id={labelId} className="block">
          <Label>{label}</Label>
        </span>
      )}

      <div
        role="group"
        aria-label={ariaLabel}
        aria-labelledby={label !== undefined ? labelId : undefined}
        aria-describedby={hint !== undefined ? hintId : undefined}
        className="flex flex-row gap-2"
      >
        {cells.map((cell, index) => (
          <input
            key={index}
            ref={(node) => {
              cellRefs.current[index] = node;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={isDisabled}
            aria-invalid={isInvalid}
            aria-label={`${ariaLabel} digit ${(index + 1).toString()} of ${digits.toString()}`}
            defaultValue={cell}
            onChange={handleChange(index)}
            onKeyDown={handleKeyDown(index)}
            onPaste={handlePaste}
            onFocus={handleFocus}
            className={joinClasses(
              'rounded-lg bg-primary text-center font-semibold text-primary shadow-xs ring-1 ring-primary ring-inset',
              'transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-hidden',
              'placeholder:text-placeholder',
              cellSizeStyles[size],
              isInvalid && 'ring-error_subtle focus-visible:ring-error',
              isDisabled && 'cursor-not-allowed opacity-50',
            )}
          />
        ))}

        {/* Hidden full-value mirror so the field participates in
            native form submission alongside the visible cells. */}
        {name !== undefined && <input type="hidden" name={name} value={currentValue} />}
      </div>

      {hint !== undefined && (
        <HintText id={hintId} isInvalid={isInvalid} size={size === 'lg' ? 'md' : size}>
          {hint}
        </HintText>
      )}
    </div>
  );
}
