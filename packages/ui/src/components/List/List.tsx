// Glaon List — vertical, semantic list primitive. UUI doesn't ship a
// generic List base; the search-results are pricing tables and full
// data tables. Glaon hand-rolls a thin layout primitive on top of
// `<ul>` / `<li>` using kit surface vocabulary as canonical reference
// (`bg-primary` + `border-secondary_alt` + `divide-secondary_alt`).
// Same wrap-pattern ladder as P4 Card and P10 TopBar — kit token CSS
// as canon, content fully parameterized through composition slots.
//
// Usage:
//
//   <List dividers>
//     <List.Item leading={<Avatar size="sm" alt="Olivia" />}>
//       <span className="font-semibold">Olivia Rhye</span>
//       <span className="text-tertiary">olivia@glaon.app</span>
//     </List.Item>
//     <List.Item
//       leading={<SearchIcon />}
//       trailing={<List.ItemAction onClick={…}>Edit</List.ItemAction>}
//     >
//       Search anything
//     </List.Item>
//   </List>

import type { MouseEventHandler, ReactNode } from 'react';

export interface ListProps {
  /**
   * Render thin border dividers between items (`divide-y`). Useful
   * for settings or transaction-log layouts.
   */
  dividers?: boolean;
  /**
   * Wrap the list in a card surface (`bg-primary` + ring + rounded).
   * @default false
   */
  bordered?: boolean;
  /**
   * Content rendered when the list has no items (no children). Use
   * for empty states — e.g. "No devices yet".
   */
  emptyState?: ReactNode;
  /** Override the kit's outer container className. */
  className?: string;
  /** `<List.Item>` children (or any content). */
  children?: ReactNode;
}

export interface ListItemProps {
  /**
   * Optional leading slot — typically an Avatar or an icon. Rendered
   * to the left of the main content.
   */
  leading?: ReactNode;
  /**
   * Optional trailing slot — typically a `<List.ItemAction>` button
   * or a status badge. Rendered to the right of the main content.
   */
  trailing?: ReactNode;
  /** Whole-row click handler. Promotes the item to a link-style row. */
  onClick?: MouseEventHandler<HTMLLIElement>;
  /** Mark the item as the active route (drives `aria-current="page"`). */
  current?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface ListItemActionProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  children: ReactNode;
}

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

// Minimal "is the children prop empty" helper. React renders `null`,
// `undefined`, and `false` as empty; an empty array also counts. For
// arrays of children, fall back to `Array.isArray(children) &&
// children.length === 0` — the typical Storybook control case.
function isEmptyChildren(children: ReactNode): boolean {
  if (children === null || children === undefined || children === false) {
    return true;
  }
  if (Array.isArray(children) && children.length === 0) {
    return true;
  }
  return false;
}

function ListRoot({
  dividers = false,
  bordered = false,
  emptyState,
  className,
  children,
}: ListProps) {
  const containerClass = joinClasses(
    'flex flex-col',
    bordered && 'rounded-xl bg-primary ring-1 ring-secondary_alt overflow-hidden',
    className,
  );
  if (isEmptyChildren(children)) {
    return (
      <div className={containerClass}>
        {emptyState ?? (
          <p className="px-4 py-8 text-center text-sm text-tertiary">No items to show.</p>
        )}
      </div>
    );
  }
  return (
    <ul
      role="list"
      className={joinClasses(containerClass, dividers && 'divide-y divide-secondary_alt')}
    >
      {children}
    </ul>
  );
}

function ListItem({ leading, trailing, onClick, current, className, children }: ListItemProps) {
  const interactive = onClick !== undefined;
  return (
    <li
      role="listitem"
      onClick={onClick}
      className={joinClasses(
        'flex items-center gap-3 px-4 py-3',
        interactive &&
          'cursor-pointer outline-focus-ring transition hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2',
        current === true && 'bg-secondary',
        className,
      )}
      aria-current={current === true ? 'page' : undefined}
    >
      {leading !== undefined ? (
        <div className="flex shrink-0 items-center text-fg-quaternary">{leading}</div>
      ) : null}
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden text-sm text-secondary">
        {children}
      </div>
      {trailing !== undefined ? (
        <div className="flex shrink-0 items-center gap-2">{trailing}</div>
      ) : null}
    </li>
  );
}

function ListItemAction({ onClick, className, children }: ListItemActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={joinClasses(
        'rounded-md px-2.5 py-1.5 text-sm font-semibold text-secondary outline-focus-ring transition hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2',
        className,
      )}
    >
      {children}
    </button>
  );
}

type ListNamespace = typeof ListRoot & {
  Item: typeof ListItem;
  ItemAction: typeof ListItemAction;
};

export const List: ListNamespace = Object.assign(ListRoot, {
  Item: ListItem,
  ItemAction: ListItemAction,
});
