// Progress cell — bar + percentage label inline. Mirrors Figma
// "Type=Progress bar" cell. Use for quota / completion / usage
// columns where the row's primary metric is a fraction of a target.

import { ProgressBarBase } from '../../ProgressBar';
import type { CellBaseProps } from './types';
import { joinClasses } from './types';

export interface ProgressCellProps extends CellBaseProps {
  /** Current value (0..max). */
  value: number;
  /** @default 100 */
  max?: number;
  /**
   * Optional label override. When omitted, renders `${value}%` (or
   * `${value}/${max}` if `max` is not 100). Hide entirely with `''`.
   */
  label?: string;
}

export function ProgressCell({
  value,
  max = 100,
  label,
  size = 'md',
  className,
}: ProgressCellProps) {
  const computedLabel =
    label ?? (max === 100 ? `${value.toString()}%` : `${value.toString()}/${max.toString()}`);
  return (
    <div className={joinClasses('flex items-center gap-3', className)}>
      <ProgressBarBase value={value} max={max} className="flex-1" />
      {computedLabel.length > 0 ? (
        <span
          className={joinClasses(
            'shrink-0 font-medium text-secondary tabular-nums',
            size === 'sm' ? 'text-xs' : 'text-sm',
          )}
        >
          {computedLabel}
        </span>
      ) : null}
    </div>
  );
}
