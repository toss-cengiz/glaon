// Multi-badge cell — renders a list of `<Badge>` chips with an
// overflow counter ("+N") when the list exceeds `max`. Mirrors Figma
// "Type=Badges multiple" cell. Use for tag / category columns where
// the row may carry several values.

import { Badge, type BadgeColor } from '../../Badge';
import type { CellBaseProps } from './types';
import { joinClasses } from './types';

export interface BadgesMultipleCellProps extends CellBaseProps {
  /**
   * Badges to render in order. Each entry produces one chip with
   * an independent colour (so a row can mix neutral + accent
   * categories).
   */
  badges: { label: string; color?: BadgeColor }[];
  /**
   * Cap the visible chip count. Excess collapses into a `+N` chip
   * keyed off the total. Pass 0 (or omit) to render every badge.
   */
  max?: number;
}

export function BadgesMultipleCell({
  badges,
  max,
  size = 'md',
  className,
}: BadgesMultipleCellProps) {
  const limit = max && max > 0 ? max : badges.length;
  const visible = badges.slice(0, limit);
  const overflow = badges.length - visible.length;

  return (
    <div className={joinClasses('flex flex-wrap items-center gap-1', className)}>
      {visible.map((badge, index) => (
        <Badge
          // Index is fine here — list is short, ordered, and
          // typically sourced from an array prop, not a stable id.
          key={`${badge.label}-${index.toString()}`}
          size={size === 'sm' ? 'sm' : 'md'}
          color={badge.color ?? 'gray'}
        >
          {badge.label}
        </Badge>
      ))}
      {overflow > 0 ? (
        <Badge size={size === 'sm' ? 'sm' : 'md'} color="gray">
          +{overflow.toString()}
        </Badge>
      ) : null}
    </div>
  );
}
