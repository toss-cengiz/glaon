// Glaon SocialButton — social-provider sign-in CTA. UUI's kit doesn't
// ship a SocialButton primitive (and `@untitledui/icons` doesn't
// expose all the brand glyphs we need — only Figma + GoogleChrome are
// in the package). Per the UUI Source Rule's "no kit source"
// exception, Glaon hand-rolls the component using kit surface
// vocabulary as canonical reference (`bg-primary` + `ring-primary` +
// `rounded-lg` + the kit Button's size scale) and parameterises the
// brand + style + label.
//
// Maps Figma's `web-primitives-social-button` axes 1:1:
//   - `Social`:         apple / discord / dribbble / facebook / figma /
//                       github / gitlab / google / linkedin / microsoft /
//                       slack / twitter (12 — Phase A + A.2.1 Tier-1
//                       auth providers)
//   - `Style`:          brand / black-outline / white-outline / icon-only (4)
//   - `Supporting text`: "Continue with X" vs "X" (boolean)
//   - `Size`:           sm / md / lg
//
// Brand glyphs come from the central registry under
// `packages/ui/src/icons/brand/` (see #309). The registry phases in
// the remaining 22 platforms — when Phase A.2.2 / A.2.3 land,
// extend the `SocialBrand` union below and add a matching
// `brandTokens` row per platform.
//
// Usage:
//
//   <SocialButton brand="google" onPress={signInWithGoogle} />
//   <SocialButton brand="apple" style="black-outline" supportingText={false} />
//   <SocialButton brand="facebook" style="icon-only" aria-label="Sign in with Facebook" />

import type { MouseEventHandler, ReactNode } from 'react';

import {
  Apple,
  Discord,
  Dribbble,
  Facebook,
  Figma,
  Github,
  Gitlab,
  Google,
  Linkedin,
  Microsoft,
  Slack,
  Twitter,
  type BrandIconProps,
} from '../../icons/brand';

export type SocialBrand =
  | 'apple'
  | 'discord'
  | 'dribbble'
  | 'facebook'
  | 'figma'
  | 'github'
  | 'gitlab'
  | 'google'
  | 'linkedin'
  | 'microsoft'
  | 'slack'
  | 'twitter';
export type SocialStyle = 'brand' | 'black-outline' | 'white-outline' | 'icon-only';
export type SocialSize = 'sm' | 'md' | 'lg';

export interface SocialButtonProps {
  /** Which provider this button signs the user in with. */
  brand: SocialBrand;
  /**
   * Visual treatment.
   * - `brand`: filled with the provider's brand colour (Google blue / Facebook navy / etc.).
   * - `black-outline`: white surface with black border (light page bg).
   * - `white-outline`: dark surface with white border (dark page bg).
   * - `icon-only`: square button with just the provider glyph.
   * @default 'brand'
   */
  style?: SocialStyle | undefined;
  /** Visual scale. @default 'md' */
  size?: SocialSize | undefined;
  /**
   * Whether to render `Continue with {brand}` (default) or just
   * `{brand}` next to the glyph. Ignored for `style='icon-only'`
   * (no label rendered at all).
   * @default true
   */
  supportingText?: boolean | undefined;
  /**
   * Override the rendered label entirely (e.g. localised
   * `Apple ile devam et`). Ignored for `style='icon-only'`.
   */
  children?: ReactNode | undefined;
  /** Disable the button. */
  isDisabled?: boolean | undefined;
  /**
   * Render the button as an `<a>` (OAuth redirect URL) instead of
   * a `<button>` (programmatic click handler). Mutually exclusive
   * with `onPress`.
   */
  href?: string | undefined;
  /** Click handler for the `<button>` variant. */
  onPress?: MouseEventHandler<HTMLButtonElement> | undefined;
  /** Tailwind override hook. */
  className?: string | undefined;
  /**
   * Accessible label override. Required for `style='icon-only'` so
   * screen readers can announce the provider name (the icon glyph
   * isn't a text node). For `style='brand' | 'outline'` the visible
   * label provides the accessible name.
   */
  'aria-label'?: string | undefined;
}

interface BrandTokens {
  label: string;
  brandClass: string;
  Glyph: (props: BrandIconProps) => ReactNode;
}

// Brand glyphs come from the central registry (#309 phase A); the
// per-brand surface treatment + label live here. When phase A.2 adds
// a new platform, expand `SocialBrand` and add a row.
const brandTokens: Record<SocialBrand, BrandTokens> = {
  apple: {
    label: 'Apple',
    brandClass: 'bg-utility-neutral-900 text-white hover:bg-utility-neutral-800',
    Glyph: Apple,
  },
  dribbble: {
    label: 'Dribbble',
    brandClass: 'bg-utility-pink-600 text-white hover:bg-utility-pink-700',
    Glyph: Dribbble,
  },
  facebook: {
    label: 'Facebook',
    brandClass: 'bg-utility-blue-700 text-white hover:bg-utility-blue-800',
    Glyph: Facebook,
  },
  figma: {
    label: 'Figma',
    brandClass: 'bg-utility-neutral-900 text-white hover:bg-utility-neutral-800',
    Glyph: Figma,
  },
  google: {
    label: 'Google',
    // Google's official Sign-In spec mandates a white surface with the
    // multicolour G mark — collapsing it to a single-colour G on a
    // brand-blue surface stripped the recognisable identity. White bg
    // + multicolour G is the canonical pattern; `text-secondary`
    // (dark text) + ring keep the button visible on light page bg's.
    // For dark page bg's, callers should swap to `style='white-
    // outline'`.
    brandClass: 'bg-primary text-secondary ring-1 ring-inset ring-primary hover:bg-primary_hover',
    Glyph: Google,
  },
  twitter: {
    label: 'Twitter',
    brandClass: 'bg-utility-neutral-900 text-white hover:bg-utility-neutral-800',
    Glyph: Twitter,
  },
  // --- Phase A.2.1 — Tier-1 auth providers ---
  github: {
    label: 'GitHub',
    // GitHub's brand bg for sign-in CTAs is canonical black; the
    // single-color Octocat inherits `currentColor` from the
    // surrounding white text.
    brandClass: 'bg-utility-neutral-900 text-white hover:bg-utility-neutral-800',
    Glyph: Github,
  },
  gitlab: {
    label: 'GitLab',
    // GitLab ships a multi-colour tanuki on a dark surface so the
    // canonical orange / red triad reads against the bg. White
    // text label keeps the wordmark legible.
    brandClass: 'bg-utility-neutral-900 text-white hover:bg-utility-neutral-800',
    Glyph: Gitlab,
  },
  microsoft: {
    label: 'Microsoft',
    // Microsoft's Sign-In spec mandates the four-square mark on a
    // white surface with dark text; the four-colour glyph is
    // brand-canonical and isn't recolour-friendly.
    brandClass: 'bg-primary text-secondary ring-1 ring-inset ring-primary hover:bg-primary_hover',
    Glyph: Microsoft,
  },
  linkedin: {
    label: 'LinkedIn',
    // LinkedIn's brand bg is `#0A66C2` (Glaon's `utility-blue-700`
    // is the closest token in the design system). White
    // single-colour glyph + label.
    brandClass: 'bg-utility-blue-700 text-white hover:bg-utility-blue-800',
    Glyph: Linkedin,
  },
  discord: {
    label: 'Discord',
    // Discord's brand `Blurple` (`#5865F2`) doesn't have a perfect
    // Glaon utility token; pair the multi-colour Clyde glyph with
    // a neutral-dark surface so it stays brand-recognisable on
    // both light and dark page bg.
    brandClass: 'bg-utility-indigo-700 text-white hover:bg-utility-indigo-800',
    Glyph: Discord,
  },
  slack: {
    label: 'Slack',
    // Slack ships a multi-colour 4-arm hashtag — keep on a white
    // surface so all four brand fills read clearly. Mirrors the
    // Google + Microsoft "white surface" pattern.
    brandClass: 'bg-primary text-secondary ring-1 ring-inset ring-primary hover:bg-primary_hover',
    Glyph: Slack,
  },
};

const sizeStyles: Record<
  SocialSize,
  { root: string; iconOnlyRoot: string; glyph: string; label: string }
> = {
  sm: {
    root: 'h-9 gap-2 rounded-md px-3.5 text-sm font-semibold',
    iconOnlyRoot: 'h-9 w-9 rounded-md',
    glyph: 'size-4',
    label: 'text-sm font-semibold',
  },
  md: {
    root: 'h-10 gap-2 rounded-md px-4 text-sm font-semibold',
    iconOnlyRoot: 'h-10 w-10 rounded-md',
    glyph: 'size-5',
    label: 'text-sm font-semibold',
  },
  lg: {
    root: 'h-11 gap-2.5 rounded-md px-5 text-md font-semibold',
    iconOnlyRoot: 'h-11 w-11 rounded-md',
    glyph: 'size-5',
    label: 'text-md font-semibold',
  },
};

const styleClasses: Record<Exclude<SocialStyle, 'brand'>, string> = {
  'black-outline':
    'bg-primary text-utility-neutral-900 ring-1 ring-inset ring-utility-neutral-300 hover:bg-utility-neutral-50',
  'white-outline': 'bg-transparent text-white ring-1 ring-inset ring-white/30 hover:bg-white/10',
  'icon-only':
    'bg-primary text-utility-neutral-900 ring-1 ring-inset ring-utility-neutral-300 hover:bg-utility-neutral-50',
};

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

const baseClass =
  'inline-flex items-center justify-center whitespace-nowrap outline-focus-ring transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Glaon SocialButton — social-provider sign-in CTA. Single
 * parametric primitive dispatching to the right brand colour /
 * label combination via the `brand` + `style` props.
 */
export function SocialButton({
  brand,
  style = 'brand',
  size = 'md',
  supportingText = true,
  children,
  isDisabled,
  href,
  onPress,
  className,
  'aria-label': ariaLabel,
}: SocialButtonProps) {
  const tokens = brandTokens[brand];
  const sizeTokens = sizeStyles[size];
  const isIconOnly = style === 'icon-only';

  const styleClass = style === 'brand' ? tokens.brandClass : styleClasses[style];
  const rootClass = joinClasses(
    baseClass,
    isIconOnly ? sizeTokens.iconOnlyRoot : sizeTokens.root,
    styleClass,
    className,
  );

  const label = isIconOnly ? null : (
    <span className={sizeTokens.label}>
      {children ?? (supportingText ? `Continue with ${tokens.label}` : tokens.label)}
    </span>
  );
  const { Glyph } = tokens;
  const glyph = (
    <span className={joinClasses(sizeTokens.glyph, 'shrink-0')}>
      <Glyph className="size-full" />
    </span>
  );
  const accessibleLabel = ariaLabel ?? (isIconOnly ? `Sign in with ${tokens.label}` : undefined);

  if (href !== undefined) {
    const anchorProps: { href?: string; 'aria-label'?: string } = { href };
    if (accessibleLabel !== undefined) anchorProps['aria-label'] = accessibleLabel;
    return (
      <a {...anchorProps} className={rootClass}>
        {glyph}
        {label}
      </a>
    );
  }

  const buttonProps: {
    type: 'button';
    disabled?: boolean;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    'aria-label'?: string;
  } = { type: 'button' };
  if (isDisabled === true) buttonProps.disabled = true;
  if (onPress !== undefined) buttonProps.onClick = onPress;
  if (accessibleLabel !== undefined) buttonProps['aria-label'] = accessibleLabel;

  return (
    <button {...buttonProps} className={rootClass}>
      {glyph}
      {label}
    </button>
  );
}
