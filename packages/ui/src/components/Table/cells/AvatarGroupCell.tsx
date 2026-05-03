// Avatar group cell — overlapping avatar stack + optional `+N`
// counter. Mirrors Figma "Type=Avatar group" cell. Use for team /
// collaborator columns where the row has multiple participants and
// individual identification matters less than the count.

import { Avatar } from '../../Avatar';
import type { CellBaseProps } from './types';
import { joinClasses } from './types';

export interface AvatarGroupCellAvatar {
  src?: string;
  alt: string;
}

export interface AvatarGroupCellProps extends CellBaseProps {
  /** Avatars in display order (left → right). */
  avatars: AvatarGroupCellAvatar[];
  /**
   * Cap the visible avatar count. Excess collapses into a `+N`
   * tile keyed off the total. Default 4.
   * @default 4
   */
  max?: number;
  /**
   * Optional total count override. Defaults to `avatars.length`;
   * set explicitly when the visible avatars are a subset of a
   * larger pool (e.g. server-paginated team list).
   */
  total?: number;
}

export function AvatarGroupCell({
  avatars,
  max = 4,
  total,
  size = 'md',
  className,
}: AvatarGroupCellProps) {
  const visible = avatars.slice(0, max);
  const totalCount = total ?? avatars.length;
  const overflow = totalCount - visible.length;
  const avatarSize = size === 'sm' ? 'sm' : 'md';
  return (
    <div
      className={joinClasses('flex items-center', className)}
      role="img"
      aria-label={`${totalCount.toString()} ${totalCount === 1 ? 'participant' : 'participants'}`}
    >
      <ul className="flex -space-x-2">
        {visible.map((avatar, index) => (
          <li key={`${avatar.alt}-${index.toString()}`} className="relative">
            <Avatar
              size={avatarSize}
              alt={avatar.alt}
              {...(avatar.src !== undefined ? { src: avatar.src } : {})}
              border
              className="ring-2 ring-white"
            />
          </li>
        ))}
        {overflow > 0 ? (
          <li
            aria-hidden="true"
            className={joinClasses(
              'flex items-center justify-center rounded-full bg-secondary text-secondary ring-2 ring-white tabular-nums',
              size === 'sm' ? 'size-7 text-xs' : 'size-8 text-sm',
            )}
          >
            +{overflow.toString()}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
