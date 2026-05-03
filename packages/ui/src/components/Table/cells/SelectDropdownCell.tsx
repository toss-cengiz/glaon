// Select dropdown cell — inline editable dropdown directly inside a
// row. Mirrors Figma "Type=Select dropdown" cell. Use for status /
// role columns where the user can update the value without leaving
// the grid.
//
// Wraps the kit `<NativeSelect>` (not the rich `<Select>`) so the
// surface stays compact inside table cells — table cells are
// height-constrained and the rich Select's popover would crowd
// neighbouring rows. Consumers needing async / multi / typeahead
// should compose their own cell with `<Select>` directly.

import type { ChangeEventHandler } from 'react';
import { useState } from 'react';

import { NativeSelect } from '../../Select';
import type { CellBaseProps } from './types';
import { joinClasses } from './types';

export interface SelectDropdownCellOption {
  value: string;
  label: string;
}

export interface SelectDropdownCellProps extends CellBaseProps {
  /** Option list. */
  options: readonly SelectDropdownCellOption[];
  /** Controlled value. */
  value?: string;
  /** Initial value (uncontrolled). */
  defaultValue?: string;
  /** Fires with the next selected value. */
  onChange?: (value: string) => void;
  /** Required accessible label (no visible label inside the cell). */
  ariaLabel: string;
  /** Disable the cell's selector. */
  isDisabled?: boolean;
}

export function SelectDropdownCell({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  ariaLabel,
  isDisabled = false,
  size = 'md',
  className,
}: SelectDropdownCellProps) {
  const [uncontrolled, setUncontrolled] = useState<string | undefined>(
    defaultValue ?? options[0]?.value,
  );
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolled;

  const handleChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    const next = event.currentTarget.value;
    if (!isControlled) setUncontrolled(next);
    onChange?.(next);
  };

  // Convert the readonly tuple to the kit's mutable shape — the kit
  // narrows internally and a readonly array trips its `options` prop
  // type.
  const optionList = options.map((option) => ({ label: option.label, value: option.value }));

  return (
    <div className={joinClasses('flex items-center', className)}>
      <NativeSelect
        aria-label={ariaLabel}
        value={currentValue ?? ''}
        onChange={handleChange}
        disabled={isDisabled}
        size={size === 'sm' ? 'sm' : 'md'}
        options={optionList}
      />
    </div>
  );
}
