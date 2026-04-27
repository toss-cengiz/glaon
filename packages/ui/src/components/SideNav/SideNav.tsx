// Glaon SideNav — application-shell side navigation. UUI ships
// `sidebar-simple` and a few siblings as concrete templates that
// hard-code the logo, search input, and a "user account" card; the
// only piece that's a clean parameterized primitive is `NavItemBase`
// (the link / collapsible item rendering). Glaon hand-rolls the
// outer shell using kit surface vocabulary as canonical reference
// (`bg-primary` + `border-secondary` border-r + 280px desktop width)
// and re-uses the kit `NavItemBase` for items, getting the kit's
// hover / current / focus styling and `aria-current="page"` wiring
// for free.
//
// Usage:
//
//   <SideNav>
//     <SideNav.Brand>
//       <Logo />
//     </SideNav.Brand>
//     <SideNav.Group label="Workspace">
//       <SideNav.Item href="/devices" icon={Cpu01} current>Devices</SideNav.Item>
//       <SideNav.Item href="/scenes" icon={Sun}>Scenes</SideNav.Item>
//     </SideNav.Group>
//     <SideNav.Footer>
//       <SideNav.Item href="/settings" icon={Settings01}>Settings</SideNav.Item>
//     </SideNav.Footer>
//   </SideNav>

import type { FC, MouseEventHandler, ReactNode } from 'react';
import { createContext, useContext } from 'react';

import { NavItemBase } from '../application/app-navigation/base-components/nav-item';

// `@untitledui/icons` ships icons without standalone `.d.ts` files,
// so importers see them as `error`-typed values under strict
// type-check + the `no-unsafe-assignment` lint rule. Same workaround
// as `icons/storybook.ts` and `Alert.tsx` — type the slot loosely so
// consumers can pass `<Cpu01 />` etc. without per-call casts. The
// kit's `NavItemBase` narrows the type back to `FC<HTMLAttributes>`
// at the render site.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type IconComponent = FC<any>;

export interface SideNavProps {
  /**
   * Reduce the width to icon-only (`w-16`). Consumers can swap to
   * collapsed at any breakpoint via their own state; this is just a
   * visual toggle.
   */
  collapsed?: boolean;
  /** Override the kit's outer container className. */
  className?: string;
  /**
   * Composed content. Use `SideNav.Brand` (top), `SideNav.Group` /
   * `SideNav.Item` (middle), and `SideNav.Footer` (bottom).
   */
  children: ReactNode;
}

export interface SideNavBrandProps {
  className?: string;
  children: ReactNode;
}

export interface SideNavGroupProps {
  /** Optional caption rendered above the items (uppercase eyebrow). */
  label?: ReactNode;
  className?: string;
  children: ReactNode;
}

export interface SideNavItemProps {
  /** Link label (becomes children of the underlying `<a>`). */
  label: ReactNode;
  /** URL (omit for non-link items that handle clicks via `onClick`). */
  href?: string;
  /** Icon component rendered before the label. */
  icon?: IconComponent;
  /** Optional badge — number / string renders a kit Badge, ReactNode passes through. */
  badge?: ReactNode;
  /** Mark this item as the active route (drives `aria-current="page"`). */
  current?: boolean;
  /** Click handler (also fires for keyboard activation). */
  onClick?: MouseEventHandler;
}

export interface SideNavFooterProps {
  className?: string;
  children: ReactNode;
}

const CollapsedContext = createContext(false);

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

function SideNavRoot({ collapsed = false, className, children }: SideNavProps) {
  const containerClass = joinClasses(
    'flex h-full flex-col gap-5 bg-primary border-r border-secondary py-5 transition-[width] duration-150',
    collapsed ? 'w-16 px-2' : 'w-70 px-4',
    className,
  );
  return (
    <CollapsedContext.Provider value={collapsed}>
      <aside className={containerClass}>
        <nav aria-label="Sidebar" className="flex h-full w-full max-w-full flex-col gap-5">
          {children}
        </nav>
      </aside>
    </CollapsedContext.Provider>
  );
}

function SideNavBrand({ className, children }: SideNavBrandProps) {
  return (
    <div className={joinClasses('flex shrink-0 items-center gap-2', className)}>{children}</div>
  );
}

function SideNavGroup({ label, className, children }: SideNavGroupProps) {
  const collapsed = useContext(CollapsedContext);
  return (
    <div className={joinClasses('flex flex-col gap-1', className)}>
      {label && !collapsed ? (
        <p className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wide text-tertiary uppercase">
          {label}
        </p>
      ) : null}
      <ul className="flex flex-col gap-px">{children}</ul>
    </div>
  );
}

function SideNavItem({ label, href, icon, badge, current, onClick }: SideNavItemProps) {
  const collapsed = useContext(CollapsedContext);
  // `NavItemBase` declares its optional props without `| undefined`,
  // so under `exactOptionalPropertyTypes` we have to omit-not-pass-
  // undefined for each one we don't have. Spread only what's defined.
  // The kit narrows `icon` to `FC<HTMLAttributes<HTMLOrSVGElement>>`;
  // our wider `IconComponent` (`FC<any>`) is assignment-safe at
  // runtime — cast at the boundary rather than tightening every
  // story's icon prop.
  return (
    // `list-none` keeps the marker bullet from showing when an Item
    // is rendered outside a styled list (e.g. inside `SideNav.Footer`,
    // which is a `<div>` because the slot also supports non-item
    // content like the user-card in WithFooterUserSection). Inside
    // `SideNav.Group`'s `<ul>` the suppression is redundant but
    // harmless.
    <li className="list-none py-px">
      <NavItemBase
        type="link"
        truncate={!collapsed}
        {...(href !== undefined ? { href } : {})}
        {...(icon !== undefined
          ? {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment -- IconComponent → kit's narrower FC<HTMLAttributes>; safe at runtime
              icon: icon as FC<any>,
            }
          : {})}
        {...(current !== undefined ? { current } : {})}
        {...(onClick !== undefined ? { onClick } : {})}
        {...(!collapsed && badge !== undefined ? { badge } : {})}
      >
        {collapsed ? null : label}
      </NavItemBase>
    </li>
  );
}

function SideNavFooter({ className, children }: SideNavFooterProps) {
  return <div className={joinClasses('mt-auto flex flex-col gap-1', className)}>{children}</div>;
}

type SideNavNamespace = typeof SideNavRoot & {
  Brand: typeof SideNavBrand;
  Group: typeof SideNavGroup;
  Item: typeof SideNavItem;
  Footer: typeof SideNavFooter;
};

export const SideNav: SideNavNamespace = Object.assign(SideNavRoot, {
  Brand: SideNavBrand,
  Group: SideNavGroup,
  Item: SideNavItem,
  Footer: SideNavFooter,
});
