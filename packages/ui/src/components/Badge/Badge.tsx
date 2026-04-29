// Glaon Badge — parametric wrap around the Untitled UI kit Badge family
// under `packages/ui/src/components/base/badges/badges.tsx`.
//
// Per CLAUDE.md's UUI Source Rule, the structural HTML/CSS + variant
// matrix come from the kit; Glaon's contribution is the wrap layer
// (token override via `theme.css` + `glaon-overrides.css`, prop API
// consistency).
//
// The kit ships 7 sibling primitives — `Badge`, `BadgeWithDot`,
// `BadgeWithIcon`, `BadgeIcon`, `BadgeWithImage`, `BadgeWithFlag`,
// `BadgeWithButton` — each sharing the same `type` / `size` / `color`
// contract, differing only in the leading/trailing slot content.
// Figma's Design System models this as a single `<Badge>` component
// with an `Icon` axis (False / Dot / Avatar / Country / Icon leading /
// Icon trailing / Only / X close).
//
// To match Figma's mental model, the Glaon `<Badge>` wrap is
// parametric: callers pass an `icon` discriminator and the wrap
// dispatches internally to the right kit primitive. The 7 kit
// primitives are still re-exported by name so consumers can reach
// them directly when they prefer the narrower types (or want
// tree-shaking to drop the dispatcher).
//
// Usage:
//
//   <Badge>Default label</Badge>                     // icon='none'
//   <Badge icon="dot" color="success">Online</Badge>
//   <Badge icon="leading" iconComponent={Star}>Pro</Badge>
//   <Badge icon="trailing" iconComponent={ArrowRight}>Continue</Badge>
//   <Badge icon="only" iconComponent={Star} />
//   <Badge icon="avatar" imgSrc="…">Olivia</Badge>
//   <Badge icon="flag" flag="TR">Türkiye</Badge>
//   <Badge icon="close" onClose={dismiss}>Filter</Badge>

import type { MouseEventHandler, ReactNode } from 'react';

import {
  Badge as KitBadge,
  BadgeIcon as KitBadgeIcon,
  BadgeWithButton as KitBadgeWithButton,
  BadgeWithDot as KitBadgeWithDot,
  BadgeWithFlag as KitBadgeWithFlag,
  BadgeWithIcon as KitBadgeWithIcon,
  BadgeWithImage as KitBadgeWithImage,
} from '../base/badges/badges';
import type { BadgeColors, FlagTypes, IconComponentType, Sizes } from '../base/badges/badge-types';

// Kit-direct exports for consumers that want the narrower per-primitive
// types (e.g. `BadgeWithDot` enforces a `BadgeWithDot`-shaped contract
// at compile time). The parametric `Badge` below stays the canonical
// import for the common case.
export {
  KitBadge as BadgeBase,
  KitBadgeIcon as BadgeIcon,
  KitBadgeWithButton as BadgeWithButton,
  KitBadgeWithDot as BadgeWithDot,
  KitBadgeWithFlag as BadgeWithFlag,
  KitBadgeWithIcon as BadgeWithIcon,
  KitBadgeWithImage as BadgeWithImage,
};

export type BadgeType = 'pill-color' | 'color' | 'modern';
export type BadgeSize = Sizes;
export type BadgeColor = BadgeColors;
export type BadgeFlag = FlagTypes;

/**
 * Discriminator for the leading / trailing slot. Maps 1:1 to Figma's
 * `Icon` axis (`web-primitives-badge`) and to the kit's 7 primitives.
 */
export type BadgeIconKind =
  | 'none'
  | 'dot'
  | 'leading'
  | 'trailing'
  | 'only'
  | 'avatar'
  | 'flag'
  | 'close';

// All slot props admit `undefined` so callers can pass conditionally-
// resolved values (e.g. `imgSrc={icon === 'avatar' ? src : undefined}`)
// from a parameterised render. Without `| undefined` here,
// `exactOptionalPropertyTypes` refuses such call sites.
export interface BadgeProps {
  /** Shape variant. */
  type?: BadgeType | undefined;
  /** Visual scale. */
  size?: BadgeSize | undefined;
  /** Semantic palette. */
  color?: BadgeColor | undefined;
  /** Inline label text. Optional when `icon === 'only'`. */
  children?: ReactNode;
  /** Tailwind override hook for the outer span. */
  className?: string | undefined;
  /**
   * Slot discriminator. Drives which kit primitive is rendered:
   * `none` → `Badge`, `dot` → `BadgeWithDot`, `leading` / `trailing`
   * → `BadgeWithIcon`, `only` → `BadgeIcon`, `avatar` →
   * `BadgeWithImage`, `flag` → `BadgeWithFlag`, `close` →
   * `BadgeWithButton`.
   * @default 'none'
   */
  icon?: BadgeIconKind | undefined;
  /** Icon glyph for `icon === 'leading' | 'trailing' | 'only'`. */
  iconComponent?: IconComponentType | undefined;
  /** Image source for `icon === 'avatar'`. */
  imgSrc?: string | undefined;
  /** Country code (ISO-2) for `icon === 'flag'`. */
  flag?: BadgeFlag | undefined;
  /** Click handler for `icon === 'close'` (X button). */
  onClose?: MouseEventHandler<HTMLButtonElement> | undefined;
  /** Accessible label for the X close button (`icon === 'close'`). */
  closeLabel?: string | undefined;
}

/**
 * Glaon Badge — single parametric primitive that dispatches to the
 * right kit sibling based on the `icon` discriminator. Matches the
 * Figma `web-primitives-badge` `Icon` axis 1:1.
 */
export function Badge({
  icon = 'none',
  iconComponent,
  imgSrc,
  flag,
  onClose,
  closeLabel,
  type = 'pill-color',
  size = 'md',
  color = 'gray',
  className,
  children,
}: BadgeProps) {
  // Build the shared props object piecewise so undefined values don't
  // leak through under `exactOptionalPropertyTypes` — the kit's
  // primitives type `className?: string` strictly (no `| undefined`).
  const baseProps: { type: BadgeType; size: BadgeSize; color: BadgeColor; className?: string } = {
    type,
    size,
    color,
  };
  if (className !== undefined) baseProps.className = className;

  if (icon === 'dot') {
    return <KitBadgeWithDot {...baseProps}>{children}</KitBadgeWithDot>;
  }

  if (icon === 'leading' && iconComponent !== undefined) {
    return (
      <KitBadgeWithIcon {...baseProps} iconLeading={iconComponent}>
        {children}
      </KitBadgeWithIcon>
    );
  }

  if (icon === 'trailing' && iconComponent !== undefined) {
    return (
      <KitBadgeWithIcon {...baseProps} iconTrailing={iconComponent}>
        {children}
      </KitBadgeWithIcon>
    );
  }

  if (icon === 'only' && iconComponent !== undefined) {
    return <KitBadgeIcon {...baseProps} icon={iconComponent} />;
  }

  if (icon === 'avatar' && imgSrc !== undefined) {
    return (
      <KitBadgeWithImage {...baseProps} imgSrc={imgSrc}>
        {children}
      </KitBadgeWithImage>
    );
  }

  if (icon === 'flag' && flag !== undefined) {
    return (
      <KitBadgeWithFlag {...baseProps} flag={flag}>
        {children}
      </KitBadgeWithFlag>
    );
  }

  if (icon === 'close') {
    const buttonProps: {
      onButtonClick?: MouseEventHandler<HTMLButtonElement>;
      buttonLabel?: string;
    } = {};
    if (onClose !== undefined) buttonProps.onButtonClick = onClose;
    if (closeLabel !== undefined) buttonProps.buttonLabel = closeLabel;
    return (
      <KitBadgeWithButton {...baseProps} {...buttonProps}>
        {children}
      </KitBadgeWithButton>
    );
  }

  return <KitBadge {...baseProps}>{children}</KitBadge>;
}
