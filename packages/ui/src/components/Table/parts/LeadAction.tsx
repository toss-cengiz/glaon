// Glaon Table.LeadAction — lead-column control primitives for table
// rows. Phase D of #323. Three sub-components mirror Figma's `Table
// cell lead action` frame ([node 10501:17313](https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=10501-17313))
// `Property 1` axis: Checkbox / Radio / Toggle.
//
// Use cases:
//   - **Checkbox** — multi-select bulk-action listings. The kit
//     `<Table selectionMode="multiple">` already auto-renders a
//     checkbox column; reach for `Table.LeadAction.Checkbox` only
//     when you need a custom-controlled checkbox column (e.g. when
//     selection state lives outside RAC).
//   - **Radio** — single-select tables (pick one default config /
//     primary card / etc.). The kit's `selectionMode="single"` ships
//     a checkbox glyph that's functionally radio-correct but visually
//     wrong; this primitive renders the canonical radio shape.
//   - **Toggle** — independent per-row enable / disable (feature flag
//     tables, integration toggles). Not a "selection" semantic;
//     each row's state is independent.
//
// Compose into the first `<Table.Cell>` of every row (and matching
// `<Table.Head>` so the column is announced to screen readers):
//
//   <Table.Header>
//     <Table.Head id="enabled">
//       <span className="sr-only">Enabled</span>
//     </Table.Head>
//     <Table.Head id="name">Integration</Table.Head>
//   </Table.Header>
//   <Table.Body items={integrations}>
//     {(row) => (
//       <Table.Row id={row.id}>
//         <Table.Cell>
//           <Table.LeadAction.Toggle
//             value={enabled.has(row.id)}
//             onChange={(next) => toggle(row.id, next)}
//             ariaLabel={`Enable ${row.name}`}
//           />
//         </Table.Cell>
//         <Table.Cell>{row.name}</Table.Cell>
//       </Table.Row>
//     )}
//   </Table.Body>

import { Switch as GlaonSwitch } from '../../Switch';
import { Checkbox } from '../../Checkbox';

interface LeadActionBaseProps {
  /** Required accessible label — the lead column has no visible header text. */
  ariaLabel: string;
  /** Disable interaction. */
  isDisabled?: boolean;
  /** Tailwind override hook. */
  className?: string;
}

export interface LeadActionCheckboxProps extends LeadActionBaseProps {
  /** Controlled selection state. */
  value: boolean;
  /** Fires with the next selection state. */
  onChange?: (next: boolean) => void;
  /** Render as indeterminate (e.g. partial group selection). */
  isIndeterminate?: boolean;
}

/**
 * Lead-column checkbox — wraps the kit `<Checkbox>` (RAC-backed)
 * with controlled `value` / `onChange` semantics. Use when the
 * row's selection state lives outside RAC (e.g. paired with a
 * server-paginated dataset where RAC's `<Table selectionMode>`
 * doesn't fit). For pure RAC multi-select, prefer
 * `<Table selectionMode="multiple">` — the kit auto-renders the
 * checkbox column for you.
 */
export function LeadActionCheckbox({
  value,
  onChange,
  isIndeterminate,
  isDisabled,
  ariaLabel,
  className,
}: LeadActionCheckboxProps) {
  const checkboxProps: Record<string, unknown> = {
    'aria-label': ariaLabel,
    isSelected: value,
    size: 'md',
  };
  if (onChange !== undefined) checkboxProps.onChange = onChange;
  if (isIndeterminate !== undefined) checkboxProps.isIndeterminate = isIndeterminate;
  if (isDisabled !== undefined) checkboxProps.isDisabled = isDisabled;
  if (className !== undefined) checkboxProps.className = className;
  return <Checkbox {...checkboxProps} />;
}

export interface LeadActionRadioProps extends LeadActionBaseProps {
  /** Whether this radio is selected. */
  value: boolean;
  /** Fires when this radio is selected. */
  onChange?: () => void;
  /** Form-group name — radios in the same group share `name`. */
  name: string;
  /** Native form value forwarded to the underlying `<input>`. */
  formValue: string;
}

/**
 * Lead-column radio — native `<input type="radio">` styled to match
 * Glaon's radio surface. Group radios across rows by sharing the
 * same `name`; `onChange` fires when this row's radio becomes the
 * group's active selection.
 */
export function LeadActionRadio({
  value,
  onChange,
  name,
  formValue,
  isDisabled,
  ariaLabel,
  className,
}: LeadActionRadioProps) {
  return (
    <span className={`relative inline-flex ${className ?? ''}`}>
      <input
        type="radio"
        name={name}
        value={formValue}
        checked={value}
        disabled={isDisabled}
        aria-label={ariaLabel}
        onChange={() => onChange?.()}
        className="size-5 cursor-pointer accent-fg-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
    </span>
  );
}

export interface LeadActionToggleProps extends LeadActionBaseProps {
  /** Controlled toggle state. */
  value: boolean;
  /** Fires with the next state. */
  onChange?: (next: boolean) => void;
}

/**
 * Lead-column toggle — Glaon `<Switch>` with controlled `value` /
 * `onChange` semantics. Use for per-row independent boolean state
 * (feature flag tables, integration enable / disable).
 */
export function LeadActionToggle({
  value,
  onChange,
  isDisabled,
  ariaLabel,
  className,
}: LeadActionToggleProps) {
  // The kit `Switch` (RAC `Toggle`) takes `aria-label` + `isSelected`
  // + `onChange`. Keep the contract symmetric across LeadAction.*.
  const switchProps: Record<string, unknown> = {
    'aria-label': ariaLabel,
    isSelected: value,
  };
  if (onChange !== undefined) {
    switchProps.onChange = (next: boolean) => {
      onChange(next);
    };
  }
  if (isDisabled !== undefined) switchProps.isDisabled = isDisabled;
  if (className !== undefined) switchProps.className = className;
  return <GlaonSwitch {...switchProps} />;
}

/**
 * Namespace bundle so consumers compose `<Table.LeadAction.Toggle>`
 * etc. matching the rest of the Table sub-component conventions.
 */
export const LeadAction = {
  Checkbox: LeadActionCheckbox,
  Radio: LeadActionRadio,
  Toggle: LeadActionToggle,
};
