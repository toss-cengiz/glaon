// Single-badge cell — a status / category pill in a column. Forwards
// to the Glaon `<Badge>` primitive so consumers don't need to know
// the per-cell sizing rules; this wrap pins the size to the row's
// scale.

import type { ReactNode } from 'react';

import { Badge, type BadgeColor } from '../../Badge';
import type { CellBaseProps } from './types';
import { joinClasses } from './types';

export interface BadgeCellProps extends CellBaseProps {
  /** Badge palette — pick the colour that matches the status semantic. */
  color?: BadgeColor;
  /** Badge label (typically the status text). */
  children: ReactNode;
}

export function BadgeCell({ color = 'gray', size = 'md', className, children }: BadgeCellProps) {
  return (
    <div className={joinClasses('flex items-center', className)}>
      <Badge size={size === 'sm' ? 'sm' : 'md'} color={color}>
        {children}
      </Badge>
    </div>
  );
}
