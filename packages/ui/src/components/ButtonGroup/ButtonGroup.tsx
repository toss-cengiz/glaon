// Glaon ButtonGroup — segmented-control primitive. The kit doesn't
// ship a generic `ButtonGroup`, so under the UUI Source Rule's
// "no kit source" exception (see CLAUDE.md), Glaon hand-rolls a
// parameterised wrap using kit surface vocabulary as canonical
// reference (`bg-primary` segment, `ring-primary` shared outer ring,
// `bg-secondary` "pressed" treatment for the selected segment).
//
// Figma reference: Design System → Button groups
// (https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=16-399).
//
// Use case: date range picker (Day / Week / Month / Year), view toggle
// (List / Grid), filter set (All / Active / Archived). Single-select
// only in V1 — multi-select / action-group / per-item href live in a
// V1.1 follow-up issue.
//
// Compound API mirrors the Tabs / Dropdown pattern — root + nested
// item, both exposed on a static-property namespace so consumers
// compose inline:
//
//   <ButtonGroup defaultValue="day" aria-label="Date range">
//     <ButtonGroup.Item value="day">Day</ButtonGroup.Item>
//     <ButtonGroup.Item value="week">Week</ButtonGroup.Item>
//   </ButtonGroup>
//
// A11y model: the wrapper is `role="group"` (toggle-button pattern)
// rather than `role="radiogroup"` because V1 doesn't ship arrow-key
// roving focus — Tab moves through each segment, Enter / Space picks
// it. Each segment carries `aria-pressed={isSelected}`.

'use client';

import { createContext, useCallback, useContext, useState, type FC, type ReactNode } from 'react';

// `@untitledui/icons` declares per-file icon types; type the slot
// loosely to match `storybookIcons` and the kit's `IconComponent`.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type IconComponent = FC<any>;

export type ButtonGroupSize = 'sm' | 'md';
export type ButtonGroupDot = 'gray' | 'brand' | 'success' | 'warning' | 'error';

interface ButtonGroupContextValue {
  size: ButtonGroupSize;
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
  isGroupDisabled: boolean;
}

const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);

function useButtonGroupContext(): ButtonGroupContextValue {
  const ctx = useContext(ButtonGroupContext);
  if (!ctx) {
    throw new Error('ButtonGroup.Item must be used inside <ButtonGroup>.');
  }
  return ctx;
}

function joinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

export interface ButtonGroupProps {
  /** Visual scale. @default 'md' */
  size?: ButtonGroupSize;
  /**
   * Currently-selected item value (controlled). Pair with `onChange`.
   * Leave undefined for uncontrolled usage and use `defaultValue`.
   */
  value?: string;
  /** Initial selected value for uncontrolled usage. */
  defaultValue?: string;
  /** Fires when the user picks a different item. */
  onChange?: (value: string) => void;
  /**
   * Disable the entire group. Individual items can still set their
   * own `isDisabled` to override per-segment.
   * @default false
   */
  isDisabled?: boolean;
  /**
   * Accessible label for the group landmark (e.g. "Date range",
   * "View mode"). Required when icon-only items are used so screen
   * readers announce the group purpose.
   */
  'aria-label'?: string;
  /** Tailwind override hook for the wrapper. */
  className?: string;
  /** Compose with `<ButtonGroup.Item>` rows. */
  children: ReactNode;
}

function ButtonGroupRoot({
  size = 'md',
  value: controlledValue,
  defaultValue,
  onChange,
  isDisabled = false,
  'aria-label': ariaLabel,
  className,
  children,
}: ButtonGroupProps) {
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const selectedValue = isControlled ? controlledValue : internalValue;

  const handleSelect = useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return (
    <ButtonGroupContext.Provider
      value={{ size, selectedValue, onSelect: handleSelect, isGroupDisabled: isDisabled }}
    >
      <div
        role="group"
        aria-label={ariaLabel}
        className={joinClasses(
          // `w-fit` blocks the cross-axis stretch a parent flex column
          // would otherwise apply (`align-items: stretch` on `inline-flex`
          // children still expands them in the cross-axis), which used
          // to paint the wrapper's empty surface as a long line right of
          // the segments. The outer ring is owned by each segment's own
          // `border` (see `ButtonGroupItem` below) — keeping the ring on
          // the wrapper hid the selected segment's top / bottom edges
          // because child backgrounds always paint over a parent's
          // `box-shadow: inset`.
          'inline-flex h-max w-fit rounded-lg shadow-xs-skeuomorphic',
          className,
        )}
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
}

export interface ButtonGroupItemProps {
  /** Stable value identifying this item — flows back via parent `onChange`. */
  value: string;
  /** Visible label. Optional when `iconOnly` is true (use `aria-label` then). */
  children?: ReactNode;
  /** Leading icon component (e.g. from `@untitledui/icons`). */
  iconLeading?: IconComponent;
  /**
   * Render only the icon — no text label. Pair with `aria-label` so
   * the segment is announced (axe `button-name`).
   * @default false
   */
  iconOnly?: boolean;
  /**
   * Status dot prefix (e.g. green for "active"). Mutually exclusive
   * with `iconLeading` — pick the affordance that matches the data.
   */
  dot?: ButtonGroupDot;
  /**
   * Disable this single segment. The parent group's `isDisabled`
   * still cascades — this prop only sharpens, it can't enable.
   * @default false
   */
  isDisabled?: boolean;
  /** A11y override for icon-only segments. */
  'aria-label'?: string;
}

interface SegmentSizeStyle {
  base: string;
  padded: string;
  iconOnly: string;
  icon: string;
  dot: string;
}

const sizeStyles: Record<ButtonGroupSize, SegmentSizeStyle> = {
  sm: {
    base: 'gap-1.5 text-sm font-semibold',
    padded: 'h-9 px-3',
    iconOnly: 'size-9',
    icon: 'size-4',
    dot: 'size-1.5',
  },
  md: {
    base: 'gap-2 text-sm font-semibold',
    padded: 'h-10 px-3.5',
    iconOnly: 'size-10',
    icon: 'size-5',
    dot: 'size-2',
  },
};

const dotColors: Record<ButtonGroupDot, string> = {
  gray: 'bg-fg-quaternary',
  brand: 'bg-brand-solid',
  success: 'bg-fg-success-primary',
  warning: 'bg-fg-warning-primary',
  error: 'bg-fg-error-primary',
};

// Selected: muted-pressed treatment (`bg-secondary`) — closer to the
// kit's "active" tab fill than to a brand call-to-action, which suits
// segmented filters where the group itself is the focus, not a single
// segment shouting for attention.
//
// Divider: each non-first segment carries a 1px left border that
// "shares" with the previous segment's right edge via `-ml-px` so the
// outer ring stays a clean 1px. Selected segment is z-raised so its
// corners overlap the divider rather than getting clipped.
function ButtonGroupItem({
  value,
  children,
  iconLeading: LeadingIcon,
  iconOnly = false,
  dot,
  isDisabled = false,
  'aria-label': ariaLabel,
}: ButtonGroupItemProps) {
  const { size, selectedValue, onSelect, isGroupDisabled } = useButtonGroupContext();
  const isSelected = selectedValue === value;
  const disabled = isDisabled || isGroupDisabled;
  const sizes = sizeStyles[size];

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={iconOnly ? ariaLabel : undefined}
      disabled={disabled}
      onClick={() => {
        onSelect(value);
      }}
      className={joinClasses(
        'relative inline-flex items-center justify-center whitespace-nowrap outline-focus-ring transition',
        'focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2',
        // Each segment owns a full `border` instead of relying on the
        // wrapper's `ring-inset` — that way the selected segment's
        // `bg-secondary` can't paint over the wrapper's top / bottom
        // ring. Adjacent segments collapse their shared edge with
        // `-ml-px` so the visible result is still a single 1px frame
        // around the group. First / last segments round to match the
        // wrapper's `rounded-lg`.
        'border border-primary first:rounded-l-lg last:rounded-r-lg',
        '[&:not(:first-child)]:-ml-px',
        'disabled:cursor-not-allowed disabled:opacity-50',
        sizes.base,
        iconOnly ? sizes.iconOnly : sizes.padded,
        isSelected
          ? 'z-10 bg-secondary text-primary'
          : 'bg-primary text-secondary hover:bg-primary_hover hover:text-secondary_hover',
      )}
    >
      {dot !== undefined ? (
        <span
          aria-hidden="true"
          className={joinClasses('shrink-0 rounded-full', sizes.dot, dotColors[dot])}
        />
      ) : null}
      {LeadingIcon !== undefined ? (
        <LeadingIcon className={joinClasses('shrink-0', sizes.icon)} aria-hidden="true" />
      ) : null}
      {iconOnly ? null : children}
    </button>
  );
}

type ButtonGroupNamespace = typeof ButtonGroupRoot & {
  Item: typeof ButtonGroupItem;
};

export const ButtonGroup: ButtonGroupNamespace = Object.assign(ButtonGroupRoot, {
  Item: ButtonGroupItem,
});
