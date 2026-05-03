// Trend cell — value + delta with directional arrow + colour coding.
// Mirrors Figma "Type=Trend positive" / "Type=Trend negative" cells.
// Use for sales / metrics columns where the delta is part of the
// row's story.

import { TrendDown02, TrendUp02 } from '@untitledui/icons';

import type { CellBaseProps } from './types';
import { joinClasses } from './types';

export type TrendDirection = 'positive' | 'negative';

export interface TrendCellProps extends CellBaseProps {
  /** Primary value (e.g. `$45,231`, `1,234`). */
  value: string;
  /** Delta (e.g. `+12.5%`, `−3.2%`). */
  delta: string;
  /**
   * Direction discriminates the colour treatment AND the arrow icon.
   * `positive` paints success-green; `negative` paints error-red.
   * Mirrors Figma's two `Type` siblings.
   */
  direction: TrendDirection;
}

export function TrendCell({ value, delta, direction, size = 'md', className }: TrendCellProps) {
  const Arrow = direction === 'positive' ? TrendUp02 : TrendDown02;
  return (
    <div className={joinClasses('flex flex-col', className)}>
      <span
        className={joinClasses(
          'truncate font-medium text-primary',
          size === 'sm' ? 'text-sm' : 'text-md',
        )}
      >
        {value}
      </span>
      {/*
        Use `utility-(green|red)-700` (darker than the kit's
        `fg-success-primary` / `fg-error-primary` which resolve to
        `*-600`). The kit foreground tokens are tuned for icon /
        accent backgrounds where contrast piggy-backs on surrounding
        ink; on a plain white table cell they fall below WCAG AA
        4.5:1 for body-text size (axe `color-contrast` failed at
        3.21:1 for `green-600` on white). The `-700` shade meets AA
        in both light and dark theme bindings.
      */}
      <span
        className={joinClasses(
          'inline-flex items-center gap-1 font-medium',
          direction === 'positive' ? 'text-utility-green-700' : 'text-utility-red-700',
          size === 'sm' ? 'text-xs' : 'text-sm',
        )}
      >
        <Arrow className="size-4 shrink-0" aria-hidden="true" />
        {delta}
      </span>
    </div>
  );
}
