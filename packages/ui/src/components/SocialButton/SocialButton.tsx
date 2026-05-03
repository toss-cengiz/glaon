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
//   - `Social`:         apple / dribbble / facebook / figma / google / twitter (6)
//   - `Style`:          brand / black-outline / white-outline / icon-only (4)
//   - `Supporting text`: "Continue with X" vs "X" (boolean)
//   - `Size`:           sm / md / lg
//
// Brand glyphs come from the central registry under
// `packages/ui/src/icons/brand/` (see #309). The registry phases in
// the remaining 28 platforms — when Phase A.2 lands, expand the
// `SocialBrand` union here and add the matching `brandTokens` row.
//
// Usage:
//
//   <SocialButton brand="google" onPress={signInWithGoogle} />
//   <SocialButton brand="apple" style="black-outline" supportingText={false} />
//   <SocialButton brand="facebook" style="icon-only" aria-label="Sign in with Facebook" />

import type { MouseEventHandler, ReactNode } from 'react';

import {
  Apple,
  Dribbble,
  Facebook,
  Figma,
  Google,
  Twitter,
  type BrandIconProps,
} from '../../icons/brand';

export type SocialBrand = 'apple' | 'dribbble' | 'facebook' | 'figma' | 'google' | 'twitter';
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
