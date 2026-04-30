// Glaon BadgeGroup — text + Badge composite. UUI's kit doesn't ship a
// generic BadgeGroup primitive; the closest references in the source
// are marketing-page header templates that hard-code their own
// "What's new + Read post" announcement chips. Per the UUI Source
// Rule's "no kit source" exception, Glaon hand-rolls a parameterised
// wrap using kit surface vocabulary as canonical reference (`bg-secondary`
// pill, inline `<Badge>` slot, optional trailing chevron icon).
//
// The Figma `web-primitives-badge-group` component (under
// [Badges page](https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=12-539))
// has these axes:
//   - Badge: `Leading` | `Trailing` (where the inner Badge sits)
//   - Size: `sm` | `md` | `lg`
//   - Color: matches Badge palette (12 colors)
//
// Usage:
//
//   <BadgeGroup
//     color="brand"
//     size="md"
//     addon={<Badge>What's new</Badge>}
//     trailingIcon={ChevronRight}
//     onPress={() => navigate('/blog/release')}
//   >
//     Read post
//   </BadgeGroup>
//
// The whole group activates as a single `<button>` when `onPress`
// is set, or an `<a>` when `href` is set; otherwise it renders as a
// presentational `<span>`.

import type { FC, MouseEventHandler, ReactNode } from 'react';

import type { BadgeColor, BadgeSize } from '../Badge';

// `@untitledui/icons` declares per-file icon types; type the slot
// loosely to match `storybookIcons` and the kit's own `IconComponent`.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type IconComponent = FC<any>;

export type BadgeGroupAddonPlacement = 'leading' | 'trailing';

export interface BadgeGroupProps {
  /** Inner Badge node — typically `<Badge>What's new</Badge>` but any node works. */
  addon: ReactNode;
  /**
   * Position of the addon relative to the main label. Mirrors Figma's
   * `Badge` axis (`Leading` / `Trailing`). @default 'leading'
   */
  addonPlacement?: BadgeGroupAddonPlacement;
  /** Visual scale. @default 'md' */
  size?: BadgeSize;
  /** Surface palette for the outer pill. @default 'gray' */
  color?: BadgeColor;
  /** Optional trailing icon (commonly a chevron). */
  trailingIcon?: IconComponent;
  /**
   * Click handler. Renders the group as a `<button>` so the whole
   * pill is keyboard-activatable.
   */
  onPress?: MouseEventHandler<HTMLButtonElement>;
  /**
   * Link destination. Renders the group as an `<a>` so the whole
   * pill is keyboard-activatable. Mutually exclusive with `onPress`.
   */
  href?: string;
  /** Tailwind override hook. */
  className?: string;
  /** Main inline text label. */
  children: ReactNode;
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'gap-1.5 py-0.5 pl-0.5 pr-2 text-xs font-medium',
  md: 'gap-2 py-1 pl-1 pr-2.5 text-sm font-medium',
  lg: 'gap-2.5 py-1.5 pl-1.5 pr-3 text-sm font-medium',
};

const surfaceColors: Record<BadgeColor, string> = {
  gray: 'bg-secondary text-secondary ring-secondary_alt',
  brand: 'bg-utility-brand-50 text-utility-brand-700 ring-utility-brand-200',
  error: 'bg-utility-error-50 text-utility-error-700 ring-utility-error-200',
  warning: 'bg-utility-warning-50 text-utility-warning-700 ring-utility-warning-200',
  success: 'bg-utility-success-50 text-utility-success-700 ring-utility-success-200',
  slate: 'bg-utility-gray-blue-50 text-utility-gray-blue-700 ring-utility-gray-blue-200',
  sky: 'bg-utility-blue-light-50 text-utility-blue-light-700 ring-utility-blue-light-200',
  blue: 'bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200',
  indigo: 'bg-utility-indigo-50 text-utility-indigo-700 ring-utility-indigo-200',
  purple: 'bg-utility-purple-50 text-utility-purple-700 ring-utility-purple-200',
  pink: 'bg-utility-pink-50 text-utility-pink-700 ring-utility-pink-200',
  orange: 'bg-utility-orange-50 text-utility-orange-700 ring-utility-orange-200',
};

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

/**
 * Glaon BadgeGroup — text + Badge composite anchored in a pill
 * surface. Use for "What's new", release announcements, or any
 * promo / CTA pair where a Badge introduces a label.
 */
export function BadgeGroup({
  addon,
  addonPlacement = 'leading',
  size = 'md',
  color = 'gray',
  trailingIcon: TrailingIcon,
  onPress,
  href,
  className,
  children,
}: BadgeGroupProps) {
  const containerClass = joinClasses(
    'inline-flex w-max items-center whitespace-nowrap rounded-full ring-1 ring-inset',
    sizeStyles[size],
    surfaceColors[color],
    (onPress !== undefined || href !== undefined) &&
      'cursor-pointer outline-focus-ring transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2',
    className,
  );

  const inner = (
    <>
      {addonPlacement === 'leading' ? addon : null}
      <span>{children}</span>
      {addonPlacement === 'trailing' ? addon : null}
      {TrailingIcon !== undefined ? (
        <TrailingIcon className="size-4 text-current" aria-hidden="true" />
      ) : null}
    </>
  );

  if (href !== undefined) {
    return (
      <a href={href} className={containerClass}>
        {inner}
      </a>
    );
  }

  if (onPress !== undefined) {
    return (
      <button type="button" onClick={onPress} className={containerClass}>
        {inner}
      </button>
    );
  }

  return <span className={containerClass}>{inner}</span>;
}
