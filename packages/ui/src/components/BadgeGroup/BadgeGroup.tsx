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

import { filledColors } from '../base/badges/badges';
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

// Padding mirrors the kit's `BadgeWithIcon` size scale: more padding
// goes on the side opposite to the addon so the label has breathing
// room. `leading` placement → small left padding (the addon already
// fills it), large right padding. `trailing` placement → mirrored.
const baseSizeStyles: Record<BadgeSize, string> = {
  sm: 'gap-1.5 py-0.5 text-xs font-medium',
  md: 'gap-2 py-1 text-sm font-medium',
  lg: 'gap-2.5 py-1.5 text-sm font-medium',
};

const leadingPadding: Record<BadgeSize, string> = {
  sm: 'pl-0.5 pr-2',
  md: 'pl-1 pr-2.5',
  lg: 'pl-1.5 pr-3',
};

const trailingPadding: Record<BadgeSize, string> = {
  sm: 'pl-2 pr-0.5',
  md: 'pl-2.5 pr-1',
  lg: 'pl-3 pr-1.5',
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
  const padding = addonPlacement === 'leading' ? leadingPadding[size] : trailingPadding[size];
  const containerClass = joinClasses(
    'inline-flex w-max items-center whitespace-nowrap rounded-full ring-1 ring-inset',
    baseSizeStyles[size],
    padding,
    // Reuse the kit's canonical `filledColors` map so the surface
    // matches `<Badge>`'s outer chrome verbatim — no duplicate token
    // table to drift out of sync.
    filledColors[color].root,
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
