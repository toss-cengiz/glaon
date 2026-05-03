// Text cell — primary line + optional secondary line. Mirrors Figma
// "Type=Text" cell. Used for name/email pairings, identifier columns,
// any free-form two-line text.

import type { CellBaseProps } from './types';
import { joinClasses } from './types';

export interface TextCellProps extends CellBaseProps {
  /** Primary line — typically the entity name or identifier. */
  primary: string;
  /** Optional secondary line in muted text (email, role, slug). */
  secondary?: string;
}

export function TextCell({ primary, secondary, size = 'md', className }: TextCellProps) {
  return (
    <div className={joinClasses('flex flex-col', className)}>
      <span
        className={joinClasses(
          'truncate font-medium text-primary',
          size === 'sm' ? 'text-sm' : 'text-md',
        )}
      >
        {primary}
      </span>
      {secondary !== undefined ? (
        <span
          className={joinClasses('truncate text-tertiary', size === 'sm' ? 'text-xs' : 'text-sm')}
        >
          {secondary}
        </span>
      ) : null}
    </div>
  );
}
