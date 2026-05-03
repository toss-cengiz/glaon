// Avatar cell — leading avatar + name + optional secondary line.
// Mirrors Figma "Type=Avatar" cell. Most common in user / team
// member listings.

import { Avatar } from '../../Avatar';
import type { CellBaseProps } from './types';
import { joinClasses } from './types';

export interface AvatarCellProps extends CellBaseProps {
  /** Avatar image URL. Falls back to initials when omitted. */
  src?: string;
  /** Avatar alt text — also used to derive initials when `src` omitted. */
  alt?: string;
  /** Primary label (typically the user's name). */
  primary: string;
  /** Optional muted line beneath the primary (email, role, handle). */
  secondary?: string;
}

export function AvatarCell({
  src,
  alt,
  primary,
  secondary,
  size = 'md',
  className,
}: AvatarCellProps) {
  return (
    <div className={joinClasses('flex items-center gap-3', className)}>
      <Avatar
        size={size === 'sm' ? 'sm' : 'md'}
        {...(src !== undefined ? { src } : {})}
        {...(alt !== undefined ? { alt } : { alt: primary })}
      />
      <div className="flex flex-col">
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
    </div>
  );
}
