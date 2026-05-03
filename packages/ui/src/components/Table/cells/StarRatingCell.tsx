// Star rating cell — N filled stars out of `max`. Mirrors Figma
// "Type=Star ratings" cell. Renders presentation-only by default;
// pass `onChange` to make the cell interactive (rare inside tables —
// reviews are usually edited on a detail page, not in-grid).

import { Star01 } from '@untitledui/icons';

import type { CellBaseProps } from './types';
import { joinClasses } from './types';

export interface StarRatingCellProps extends CellBaseProps {
  /** Filled star count (0..max). Fractional values floor to nearest int. */
  value: number;
  /** Total number of stars. @default 5 */
  max?: number;
  /** Accessible label. @default `${value} out of ${max} stars` */
  ariaLabel?: string;
}

export function StarRatingCell({
  value,
  max = 5,
  size = 'md',
  ariaLabel,
  className,
}: StarRatingCellProps) {
  const filled = Math.max(0, Math.min(max, Math.floor(value)));
  const stars = Array.from({ length: max }, (_, index) => index < filled);
  const label = ariaLabel ?? `${value.toString()} out of ${max.toString()} stars`;
  return (
    <div
      role="img"
      aria-label={label}
      className={joinClasses('flex items-center gap-0.5', className)}
    >
      {stars.map((isFilled, index) => (
        <Star01
          key={index}
          aria-hidden="true"
          className={joinClasses(
            size === 'sm' ? 'size-4' : 'size-5',
            isFilled ? 'text-fg-warning-primary fill-current' : 'text-fg-quaternary',
          )}
        />
      ))}
    </div>
  );
}
