// Glaon RadioGroup — wrap layer over the kit `RadioGroup` that
// adds three things the kit does not:
//
// 1. **Group form structure** — `label`, `description`, `errorMessage`,
//    `isRequired`, `tooltip`. Rendered via the kit's `Label` +
//    `HintText` so the typography matches Input / Select / Checkbox.
//
// 2. **Orientation override** — the kit hardcodes `flex flex-col`;
//    when `orientation="horizontal"` is set, we swap the inner
//    radios container to `flex-row flex-wrap`. RAC's keyboard
//    contract is unchanged (it already swaps arrow-key directions
//    per orientation).
//
// 3. **`isInvalid` autosense** — passing `errorMessage` flips the
//    group into the invalid state so RAC's `aria-invalid` and the
//    error-message slot wire up automatically.

import { type ReactNode } from 'react';
import { type RadioGroupProps as AriaRadioGroupProps } from 'react-aria-components';

import { HintText } from '../base/input/hint-text';
import { Label } from '../base/input/label';
import { RadioGroup as KitRadioGroup } from '../base/radio-buttons/radio-buttons';
import { cx } from '../../utils/cx';

export interface RadioGroupProps extends Omit<AriaRadioGroupProps, 'children' | 'className'> {
  /** Visible group label. Auto-wired to the radios via RAC's `<Label>`. */
  label?: ReactNode;
  /** Helper text rendered under the radios. */
  description?: ReactNode;
  /** Error message — when set, the group also flips into the invalid state. */
  errorMessage?: ReactNode;
  /** Tooltip text shown next to the label. */
  tooltip?: string;
  /** Layout direction. @default 'vertical' */
  orientation?: 'horizontal' | 'vertical';
  /** Radio scale — propagates via `RadioGroupContext` to children. */
  size?: 'sm' | 'md';
  /** Tailwind override hook for the outer wrapper. */
  className?: string;
  children: ReactNode;
}

export function RadioGroup({
  label,
  description,
  errorMessage,
  tooltip,
  orientation = 'vertical',
  isInvalid,
  isRequired,
  size,
  className,
  children,
  ...rest
}: RadioGroupProps) {
  const computedInvalid = isInvalid ?? errorMessage !== undefined;

  return (
    <KitRadioGroup
      {...rest}
      isInvalid={computedInvalid}
      {...(isRequired !== undefined ? { isRequired } : {})}
      orientation={orientation}
      {...(size !== undefined ? { size } : {})}
      className={cx('flex flex-col gap-1.5', className)}
    >
      {label !== undefined && (
        <Label
          {...(isRequired !== undefined ? { isRequired } : {})}
          {...(tooltip !== undefined ? { tooltip } : {})}
        >
          {label}
        </Label>
      )}

      <div
        className={cx(
          orientation === 'horizontal'
            ? 'flex flex-row flex-wrap gap-x-6 gap-y-3'
            : 'flex flex-col gap-3',
        )}
      >
        {children}
      </div>

      {errorMessage !== undefined ? (
        <HintText isInvalid>{errorMessage}</HintText>
      ) : description !== undefined ? (
        <HintText>{description}</HintText>
      ) : null}
    </KitRadioGroup>
  );
}
