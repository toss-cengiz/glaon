// Glaon Input — single parametric primitive that dispatches to one of
// seven layouts based on the `variant` discriminator. The default
// variant re-exports the kit `Input` source verbatim (byte-equal
// pass-through); the other six are hand-rolled per the UUI Source
// Rule's "no kit source" exception, since the kit doesn't ship slot
// composites for the patterns Figma's Inputs page requires
// (https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=85-1269).
//
// Variant matrix:
//   - default            — kit Input verbatim (icon + shortcut + password toggle).
//   - leading-text       — static `<span>` prefix (e.g. `https://`).
//   - trailing-button    — small inline submit-style `<Button>` (e.g. `Send`).
//   - leading-dropdown   — `<select>` on the left (country code, URL prefix).
//   - trailing-dropdown  — `<select>` on the right (currency picker).
//   - payment            — masked card-number input + brand auto-detect.
//   - tags-inner         — multi-value chip pattern (mirrors `<Textarea variant='tags-inner'>`).
//
// Every non-default variant reuses the kit `bg-primary` / `ring-primary`
// surface vocabulary so they read as one family — only the slot layout
// differs. State plumbing (label binding, `aria-invalid`,
// `aria-describedby`) flows through `<AriaTextField>` for variants that
// need it.

import { CreditCard02 } from '@untitledui/icons';

import { paymentIconForBrand } from '../../icons/payment';
import type {
  ChangeEventHandler,
  ClipboardEventHandler,
  ComponentProps,
  ComponentType,
  FocusEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
  Ref,
} from 'react';
import { useCallback, useId, useRef, useState } from 'react';
import {
  Group as AriaGroup,
  Input as AriaInput,
  TextField as AriaTextField,
} from 'react-aria-components';

import { Badge } from '../Badge';
import { Button } from '../Button';
import { HintText } from '../base/input/hint-text';
import { Label } from '../base/input/label';
import { Input as KitInput } from '../base/input/input';

export type { InputBaseProps, TextFieldProps as KitTextFieldProps } from '../base/input/input';
export { InputBase, TextField } from '../base/input/input';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant =
  | 'default'
  | 'payment'
  | 'leading-dropdown'
  | 'trailing-dropdown'
  | 'leading-text'
  | 'trailing-button'
  | 'tags-inner';

/** Card brand families auto-detected by the `payment` variant. */
export type PaymentBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

/** Keyboard tokens that confirm the current text into a chip (tags-inner). */
export type InputTagSeparator = 'Enter' | ',' | ' ';

export interface InputDropdownOption {
  value: string;
  label: string;
}

// `@untitledui/icons` declares per-file icon types; type the slot
// loosely to match `storybookIcons` and the kit's `IconComponent`.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type IconComponent = ComponentType<any>;

export interface InputProps {
  /**
   * Layout variant. `default` (kit verbatim) is the existing Phase 1
   * surface; the six others swap the slot layout while sharing the
   * same surface ring + focus / invalid affordances.
   * @default 'default'
   */
  variant?: InputVariant;

  // --- shared props (every variant) ---

  label?: string;
  hint?: ReactNode;
  tooltip?: string;
  size?: InputSize;
  type?: string;
  placeholder?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  hideRequiredIndicator?: boolean;
  value?: string;
  defaultValue?: string;
  name?: string;
  /**
   * Standard HTML `autocomplete` token forwarded to the underlying
   * `<input>` so password managers and browser autofill resolve
   * fields correctly (e.g. `'username'`, `'email'`, `'current-password'`).
   * The kit `Input` accepts arbitrary input attributes via pass-through
   * on the `default` variant; non-default variants that need a fixed
   * autocomplete token (e.g. `payment` → `cc-number`) set it via
   * `inputOverrides` internally.
   */
  autoComplete?: string;
  onChange?: (value: string) => void;
  onBlur?: FocusEventHandler;
  onFocus?: FocusEventHandler;
  className?: string;
  inputClassName?: string;
  ref?: Ref<HTMLDivElement>;
  inputRef?: Ref<HTMLInputElement>;

  // --- default variant slot props ---

  /** Leading icon (default variant only). */
  icon?: IconComponent;
  /** Trailing keyboard shortcut hint text (default variant only). */
  shortcut?: string | boolean;

  // --- leading-text ---

  /**
   * Static text prefix shown inside the surface, before the input
   * (e.g. `https://`, `+90`). Only honoured when `variant='leading-text'`.
   */
  leadingText?: string;

  // --- leading-dropdown / trailing-dropdown ---

  /** Option list for the inline `<select>` slot. */
  dropdownOptions?: readonly InputDropdownOption[];
  /** Controlled dropdown value. */
  dropdownValue?: string;
  /** Initial dropdown value (uncontrolled). */
  defaultDropdownValue?: string;
  /** Fires when the inline `<select>` value changes. */
  onDropdownChange?: (value: string) => void;
  /** Required `aria-label` for the inline `<select>` (e.g. "Country code"). */
  dropdownAriaLabel?: string;

  // --- trailing-button ---

  /** Inline button label (e.g. `Send`, `Apply`, `Search`). */
  trailingButtonLabel?: string;
  /** Inline button click handler. */
  onTrailingButtonPress?: MouseEventHandler<HTMLButtonElement>;
  /** Optional leading icon for the inline button. */
  trailingButtonIconLeading?: IconComponent;

  // --- payment ---

  /**
   * Fires when the auto-detected card brand changes
   * (variant='payment'). Use to render the brand logo elsewhere or
   * customise the surrounding form copy.
   */
  onPaymentBrandDetected?: (brand: PaymentBrand) => void;

  // --- tags-inner ---

  tags?: readonly string[];
  defaultTags?: readonly string[];
  onTagsChange?: (tags: string[]) => void;
  addTagOn?: readonly InputTagSeparator[];
}

const DEFAULT_TAG_SEPARATORS: readonly InputTagSeparator[] = ['Enter', ','];

function joinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

// Surface mirrors the kit's `InputBase` group surface so the seven
// variants read as a single family — same rounded ring, focus ring,
// and invalid affordances; only the slot layout differs.
const surface =
  'flex w-full flex-row items-stretch rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset transition focus-within:ring-2 focus-within:ring-brand';
const sizeStyles: Record<InputSize, string> = {
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-md',
};
const inputPadding: Record<InputSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-3 py-2',
  lg: 'px-3.5 py-2.5',
};
const surfaceInvalid = 'ring-error_subtle focus-within:ring-2 focus-within:ring-error';
const surfaceDisabled = 'cursor-not-allowed opacity-50';

// Glaon-only prop names — never forward these to the kit Input,
// which would warn about unknown props.
const GLAON_ONLY_PROPS: ReadonlySet<string> = new Set([
  'variant',
  'leadingText',
  'dropdownOptions',
  'dropdownValue',
  'defaultDropdownValue',
  'onDropdownChange',
  'dropdownAriaLabel',
  'trailingButtonLabel',
  'onTrailingButtonPress',
  'trailingButtonIconLeading',
  'onPaymentBrandDetected',
  'tags',
  'defaultTags',
  'onTagsChange',
  'addTagOn',
  'inputRef',
]);

export function Input(props: InputProps) {
  const variant = props.variant ?? 'default';

  if (variant === 'default') return <DefaultInput {...props} />;
  if (variant === 'leading-text') return <LeadingTextInput {...props} />;
  if (variant === 'trailing-button') return <TrailingButtonInput {...props} />;
  if (variant === 'leading-dropdown') return <DropdownInput {...props} placement="leading" />;
  if (variant === 'trailing-dropdown') return <DropdownInput {...props} placement="trailing" />;
  if (variant === 'payment') return <PaymentInputVariant {...props} />;
  return <TagsInnerInput {...props} />;
}

// --- default variant: forward to kit Input verbatim --------------------------

function DefaultInput(props: InputProps) {
  const passthrough: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (GLAON_ONLY_PROPS.has(key)) continue;
    if (value !== undefined) passthrough[key] = value;
  }
  // Kit `Input` uses `ref` for the input element; map our `inputRef`
  // explicitly so consumers don't lose access to the input node.
  if (props.inputRef !== undefined) passthrough.ref = props.inputRef;
  return <KitInput {...passthrough} />;
}

// --- shared scaffolding for non-default variants -----------------------------

interface ScaffoldProps extends InputProps {
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Pass-through overrides for the inner `<AriaInput>` (placeholder, type, onKeyDown, …). */
  inputOverrides?: Partial<ComponentProps<typeof AriaInput>>;
  /** Render-prop wrapping the input — used by tags-inner to wrap chips next to the input. */
  inputArea?: (defaultInput: ReactNode) => ReactNode;
}

function VariantScaffold({
  label,
  hint,
  tooltip,
  size = 'md',
  type = 'text',
  placeholder,
  isInvalid = false,
  isDisabled = false,
  isReadOnly = false,
  isRequired = false,
  hideRequiredIndicator = false,
  value,
  defaultValue,
  name,
  onChange,
  onBlur,
  onFocus,
  className,
  inputClassName,
  ref,
  inputRef,
  leading,
  trailing,
  inputOverrides,
  inputArea,
}: ScaffoldProps) {
  const hintId = useId();

  // `<AriaTextField>` rejects an explicit `undefined` for any optional
  // prop under `exactOptionalPropertyTypes`. Build the props bag
  // conditionally and cast on the spread.
  const fieldProps: Record<string, unknown> = {
    isInvalid,
    isDisabled,
    isReadOnly,
    isRequired,
    type,
    className: joinClasses(
      'group flex h-max w-full flex-col items-start justify-start gap-1.5',
      className,
    ),
  };
  if (value !== undefined) fieldProps.value = value;
  if (defaultValue !== undefined) fieldProps.defaultValue = defaultValue;
  if (name !== undefined) fieldProps.name = name;
  if (onChange !== undefined) fieldProps.onChange = onChange;
  if (onBlur !== undefined) fieldProps.onBlur = onBlur;
  if (onFocus !== undefined) fieldProps.onFocus = onFocus;
  if (ref !== undefined) fieldProps.ref = ref;

  const surfaceClass = joinClasses(
    surface,
    sizeStyles[size],
    isInvalid && surfaceInvalid,
    isDisabled && surfaceDisabled,
  );

  const inputProps: Record<string, unknown> = {
    className: joinClasses(
      'm-0 w-full bg-transparent text-primary outline-hidden placeholder:text-placeholder',
      inputPadding[size],
      inputClassName,
    ),
  };
  if (placeholder !== undefined) inputProps.placeholder = placeholder;
  if (inputRef !== undefined) inputProps.ref = inputRef;
  if (inputOverrides !== undefined) Object.assign(inputProps, inputOverrides);

  const inputElement = <AriaInput {...inputProps} />;

  const labelProps: Record<string, unknown> = {
    isRequired: hideRequiredIndicator ? !hideRequiredIndicator : isRequired,
  };
  if (tooltip !== undefined) labelProps.tooltip = tooltip;

  return (
    <AriaTextField {...fieldProps}>
      {label !== undefined && <Label {...labelProps}>{label}</Label>}
      <AriaGroup className={surfaceClass}>
        {leading}
        {inputArea !== undefined ? inputArea(inputElement) : inputElement}
        {trailing}
      </AriaGroup>
      {hint !== undefined && (
        <HintText id={hintId} isInvalid={isInvalid} size={size === 'lg' ? 'md' : size}>
          {hint}
        </HintText>
      )}
    </AriaTextField>
  );
}

// --- leading-text variant ----------------------------------------------------

function LeadingTextInput(props: InputProps) {
  const { leadingText, size = 'md' } = props;
  const leading =
    leadingText !== undefined ? (
      <span
        aria-hidden="true"
        className={joinClasses(
          'flex items-center border-r border-primary text-tertiary select-none',
          size === 'lg' ? 'px-3.5' : 'px-3',
        )}
      >
        {leadingText}
      </span>
    ) : null;
  return <VariantScaffold {...props} leading={leading} />;
}

// --- trailing-button variant -------------------------------------------------

function TrailingButtonInput(props: InputProps) {
  const { trailingButtonLabel, onTrailingButtonPress, trailingButtonIconLeading } = props;
  const buttonProps: Record<string, unknown> = { size: 'sm', color: 'secondary' };
  if (trailingButtonIconLeading !== undefined) {
    buttonProps.iconLeading = trailingButtonIconLeading;
  }
  if (onTrailingButtonPress !== undefined) {
    buttonProps.onClick = onTrailingButtonPress;
  }
  const trailing =
    trailingButtonLabel !== undefined ? (
      <div className="flex items-center pr-1.5 py-1.5">
        <Button {...buttonProps}>{trailingButtonLabel}</Button>
      </div>
    ) : null;
  return <VariantScaffold {...props} trailing={trailing} />;
}

// --- leading / trailing dropdown variants ------------------------------------

function DropdownInput(props: InputProps & { placement: 'leading' | 'trailing' }) {
  const {
    placement,
    dropdownOptions = [],
    dropdownValue: controlledDropdownValue,
    defaultDropdownValue,
    onDropdownChange,
    dropdownAriaLabel,
    isDisabled = false,
    size = 'md',
  } = props;

  const [uncontrolled, setUncontrolled] = useState<string | undefined>(
    defaultDropdownValue ?? dropdownOptions[0]?.value,
  );
  const isControlled = controlledDropdownValue !== undefined;
  const currentValue = isControlled ? controlledDropdownValue : uncontrolled;

  const handleChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    const next = event.currentTarget.value;
    if (!isControlled) setUncontrolled(next);
    onDropdownChange?.(next);
  };

  const selectClass = joinClasses(
    'cursor-pointer bg-transparent pr-2 pl-3 text-secondary outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset',
    size === 'sm' ? 'text-sm' : 'text-md',
    placement === 'leading'
      ? 'rounded-l-lg border-r border-primary'
      : 'rounded-r-lg border-l border-primary',
  );

  const selectProps: Record<string, unknown> = {
    value: currentValue ?? '',
    onChange: handleChange,
    disabled: isDisabled,
    className: selectClass,
  };
  if (dropdownAriaLabel !== undefined) selectProps['aria-label'] = dropdownAriaLabel;

  const select = (
    <select {...selectProps}>
      {dropdownOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (placement === 'leading') return <VariantScaffold {...props} leading={select} />;
  return <VariantScaffold {...props} trailing={select} />;
}

// --- payment variant ---------------------------------------------------------

const cardBrandPatterns: { brand: PaymentBrand; pattern: RegExp }[] = [
  { brand: 'visa', pattern: /^4/ },
  { brand: 'mastercard', pattern: /^(5[1-5]|2[2-7])/ },
  { brand: 'amex', pattern: /^3[47]/ },
  { brand: 'discover', pattern: /^(6011|65)/ },
];

function detectBrand(digits: string): PaymentBrand {
  for (const candidate of cardBrandPatterns) {
    if (candidate.pattern.test(digits)) return candidate.brand;
  }
  return 'unknown';
}

function maskCardNumber(raw: string, brand: PaymentBrand): string {
  const digits = raw.replace(/\D/g, '');
  // AMEX uses 4-6-5 grouping; everyone else uses 4-4-4-4.
  const groups = brand === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];
  const out: string[] = [];
  let cursor = 0;
  for (const groupSize of groups) {
    const slice = digits.slice(cursor, cursor + groupSize);
    if (slice.length === 0) break;
    out.push(slice);
    cursor += groupSize;
    if (digits.length <= cursor) break;
  }
  return out.join(' ');
}

function PaymentInputVariant(props: InputProps) {
  const { value: controlledValue, defaultValue, onChange, onPaymentBrandDetected } = props;

  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '');
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolled;
  const digits = currentValue.replace(/\D/g, '');
  const brand = detectBrand(digits);
  const lastBrandRef = useRef<PaymentBrand>(brand);
  if (lastBrandRef.current !== brand) {
    lastBrandRef.current = brand;
    onPaymentBrandDetected?.(brand);
  }

  const handleChange = useCallback(
    (next: string) => {
      const masked = maskCardNumber(next, brand);
      if (!isControlled) setUncontrolled(masked);
      onChange?.(masked);
    },
    [brand, isControlled, onChange],
  );

  // The leading glyph swaps to per-brand artwork via the payment
  // registry's `paymentIconForBrand` helper (#368 D.2.a). When the
  // detected brand is `unknown` the helper returns `undefined` and
  // we fall back to the kit's neutral `CreditCard02`.
  const BrandGlyph = paymentIconForBrand(brand);
  const leading = (
    <span aria-hidden="true" className="flex items-center pl-3 text-fg-quaternary">
      {BrandGlyph !== undefined ? (
        <BrandGlyph className="h-5" />
      ) : (
        <CreditCard02 className="size-5" />
      )}
    </span>
  );

  return (
    <VariantScaffold
      {...props}
      value={currentValue}
      onChange={handleChange}
      inputOverrides={{ inputMode: 'numeric', autoComplete: 'cc-number' }}
      leading={leading}
    />
  );
}

// --- tags-inner variant ------------------------------------------------------

function TagsInnerInput(props: InputProps) {
  const {
    tags: controlledTags,
    defaultTags,
    onTagsChange,
    addTagOn = DEFAULT_TAG_SEPARATORS,
    placeholder,
    size = 'md',
    isReadOnly = false,
    isDisabled = false,
  } = props;

  const [uncontrolledTags, setUncontrolledTags] = useState<string[]>(() =>
    defaultTags !== undefined ? [...defaultTags] : [],
  );
  const isControlled = controlledTags !== undefined;
  const currentTags: readonly string[] = isControlled ? controlledTags : uncontrolledTags;

  const updateTags = useCallback(
    (next: string[]) => {
      if (!isControlled) setUncontrolledTags(next);
      onTagsChange?.(next);
    },
    [isControlled, onTagsChange],
  );

  const [draftValue, setDraftValue] = useState('');

  const commitDraft = useCallback(
    (raw: string) => {
      const cleaned = raw.trim();
      if (cleaned.length === 0) return;
      if (currentTags.includes(cleaned)) {
        setDraftValue('');
        return;
      }
      updateTags([...currentTags, cleaned]);
      setDraftValue('');
    },
    [currentTags, updateTags],
  );

  const removeTag = useCallback(
    (tag: string) => {
      updateTags(currentTags.filter((t) => t !== tag));
    },
    [currentTags, updateTags],
  );

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (isReadOnly || isDisabled) return;
    const token: InputTagSeparator | undefined =
      event.key === 'Enter'
        ? 'Enter'
        : event.key === ','
          ? ','
          : event.key === ' '
            ? ' '
            : undefined;
    if (token !== undefined && addTagOn.includes(token)) {
      event.preventDefault();
      commitDraft(draftValue);
      return;
    }
    if (event.key === 'Backspace' && draftValue.length === 0 && currentTags.length > 0) {
      event.preventDefault();
      const next = [...currentTags];
      next.pop();
      updateTags(next);
    }
  };

  const handlePaste: ClipboardEventHandler<HTMLInputElement> = (event) => {
    if (isReadOnly || isDisabled) return;
    const pasted = event.clipboardData.getData('text');
    const bulkDelimiter = addTagOn.find((s) => s !== 'Enter');
    if (bulkDelimiter === undefined || !pasted.includes(bulkDelimiter)) return;
    event.preventDefault();
    const additions = pasted
      .split(bulkDelimiter)
      .map((part) => part.trim())
      .filter((part) => part.length > 0 && !currentTags.includes(part));
    if (additions.length === 0) return;
    const deduped = additions.filter((entry, index, all) => all.indexOf(entry) === index);
    updateTags([...currentTags, ...deduped]);
    setDraftValue('');
  };

  const chipList =
    currentTags.length > 0 ? (
      <ul className="flex flex-wrap gap-1.5 py-1.5 pl-2" role="list">
        {currentTags.map((tag) => (
          <li key={tag}>
            <Badge
              size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}
              color="gray"
              icon="close"
              closeLabel={`Remove ${tag}`}
              onClose={() => {
                removeTag(tag);
              }}
            >
              {tag}
            </Badge>
          </li>
        ))}
      </ul>
    ) : null;

  // Drop placeholder-when-chips-present by re-spreading into the
  // forwarded props bag (avoids handing the scaffold an explicit
  // `undefined` for an optional prop under exactOptionalPropertyTypes).
  const scaffoldProps: ScaffoldProps = {
    ...props,
    value: draftValue,
    onChange: setDraftValue,
    inputOverrides: { onKeyDown: handleKeyDown, onPaste: handlePaste },
    inputArea: (input) => (
      <div className="flex flex-1 flex-wrap items-center">
        {chipList}
        <div className="min-w-[120px] flex-1">{input}</div>
      </div>
    ),
  };
  if (currentTags.length === 0 && placeholder !== undefined) {
    scaffoldProps.placeholder = placeholder;
  } else {
    delete scaffoldProps.placeholder;
  }

  return <VariantScaffold {...scaffoldProps} />;
}
