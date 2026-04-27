// Glaon TopBar — application-shell header. UUI ships only marketing-
// header templates (`header.tsx` under `marketing/header-navigation/`)
// — concrete files with hard-coded nav items / dropdowns / mobile
// menu — so the Glaon wrap hand-rolls a parameterized layout
// primitive using the kit's surface vocabulary (`bg-primary` +
// `border-secondary_alt` + `h-16` for default height) as canonical
// reference. Same wrap-pattern ladder as P2 Alert / Banner, P3 Stat,
// and P4 Card — kit token CSS as canonical reference, content fully
// parameterized through three composition slots.
//
// Usage:
//
//   <TopBar>
//     <TopBar.Brand>
//       <Logo />
//     </TopBar.Brand>
//     <TopBar.Nav>
//       <a href="/devices">Devices</a>
//       <a href="/scenes">Scenes</a>
//     </TopBar.Nav>
//     <TopBar.Actions>
//       <SearchInput />
//       <Avatar />
//     </TopBar.Actions>
//   </TopBar>

import type { ReactNode } from 'react';

export interface TopBarProps {
  /**
   * Reduce the bar height (`h-12` instead of `h-16`). Useful inside
   * dense dashboards or wall-tablet layouts.
   */
  compact?: boolean;
  /** Override the kit's outer container className. */
  className?: string;
  /**
   * Three slots: `TopBar.Brand` / `TopBar.Nav` / `TopBar.Actions`.
   * The component renders flex layout — left / center / right —
   * regardless of declaration order.
   */
  children: ReactNode;
}

export interface TopBarBrandProps {
  className?: string;
  children: ReactNode;
}

export interface TopBarNavProps {
  /**
   * Centered nav items. On mobile (< md) the slot collapses; consumers
   * are responsible for providing a hamburger / drawer in
   * `TopBar.Actions` instead.
   */
  className?: string;
  children: ReactNode;
}

export interface TopBarActionsProps {
  className?: string;
  children: ReactNode;
}

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

function TopBarRoot({ compact = false, className, children }: TopBarProps) {
  const containerClass = joinClasses(
    'flex w-full items-center gap-4 bg-primary border-b border-secondary_alt px-4 md:px-6',
    compact ? 'h-12' : 'h-16',
    className,
  );
  return <header className={containerClass}>{children}</header>;
}

function TopBarBrand({ className, children }: TopBarBrandProps) {
  return (
    <div className={joinClasses('flex shrink-0 items-center gap-2', className)}>{children}</div>
  );
}

function TopBarNav({ className, children }: TopBarNavProps) {
  return (
    <nav
      aria-label="Primary"
      className={joinClasses('hidden flex-1 items-center justify-center gap-1 md:flex', className)}
    >
      {children}
    </nav>
  );
}

function TopBarActions({ className, children }: TopBarActionsProps) {
  return (
    <div className={joinClasses('ml-auto flex shrink-0 items-center gap-2', className)}>
      {children}
    </div>
  );
}

type TopBarNamespace = typeof TopBarRoot & {
  Brand: typeof TopBarBrand;
  Nav: typeof TopBarNav;
  Actions: typeof TopBarActions;
};

export const TopBar: TopBarNamespace = Object.assign(TopBarRoot, {
  Brand: TopBarBrand,
  Nav: TopBarNav,
  Actions: TopBarActions,
});
