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
// Brand SVG glyphs are inlined here — `@untitledui/icons` doesn't
// ship most of them, and importing per-brand asset packages would
// pull in too much dependency surface.
//
// Usage:
//
//   <SocialButton brand="google" onPress={signInWithGoogle} />
//   <SocialButton brand="apple" style="black-outline" supportingText={false} />
//   <SocialButton brand="facebook" style="icon-only" aria-label="Sign in with Facebook" />

import type { MouseEventHandler, ReactNode } from 'react';

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
  glyph: ReactNode;
}

// Inline brand SVGs — minimal viewBox 0 0 24 24 paths so the glyph
// inherits `currentColor` from the surrounding button text colour
// (white for `brand`, black for `black-outline`, etc.).
const brandTokens: Record<SocialBrand, BrandTokens> = {
  apple: {
    label: 'Apple',
    brandClass: 'bg-utility-neutral-900 text-white hover:bg-utility-neutral-800',
    glyph: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.535 12.625c.024-2.612 2.13-3.873 2.226-3.93-1.213-1.77-3.099-2.013-3.766-2.038-1.601-.162-3.124.943-3.937.943-.812 0-2.062-.92-3.388-.895-1.745.025-3.354 1.013-4.252 2.572-1.812 3.143-.464 7.793 1.301 10.34.86 1.247 1.886 2.652 3.232 2.602 1.296-.052 1.787-.84 3.354-.84 1.567 0 2.011.84 3.39.812 1.396-.025 2.282-1.275 3.137-2.526.985-1.451 1.392-2.85 1.417-2.924-.031-.014-2.722-1.046-2.748-4.116Zm-2.594-7.55c.715-.866 1.197-2.069 1.066-3.27-1.029.041-2.275.685-3.013 1.55-.661.766-1.241 1.989-1.084 3.166 1.151.089 2.315-.585 3.031-1.446Z" />
      </svg>
    ),
  },
  dribbble: {
    label: 'Dribbble',
    brandClass: 'bg-utility-pink-600 text-white hover:bg-utility-pink-700',
    glyph: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm6.605 4.61a8.502 8.502 0 0 1 1.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.139-.12-.286-.182-.429-.156-.371-.337-.748-.514-1.108 3.142-1.276 4.572-3.117 4.709-3.506ZM12 3.475c2.17 0 4.154.813 5.661 2.144-.115.165-1.41 1.888-4.45 3.024C11.815 6.099 10.13 3.971 9.873 3.65A8.51 8.51 0 0 1 12 3.475Zm-3.667.787a53.94 53.94 0 0 1 3.293 4.954c-3.985 1.061-7.51 1.039-7.871 1.039A8.532 8.532 0 0 1 8.333 4.262Zm-3.667 7.74c0-.121.005-.241.013-.36.355.008 4.526.062 8.78-1.213.247.476.475.964.685 1.453a16.6 16.6 0 0 0-.302.119c-4.401 1.42-6.751 5.327-6.945 5.658a8.487 8.487 0 0 1-2.231-5.657Zm7.339 7.246a16.46 16.46 0 0 0-2.36-.65 8.484 8.484 0 0 1-3.566-2.99c.151-.252 2.118-3.834 6.911-5.471l.054-.018c1.207 3.13 1.7 5.752 1.825 6.503-1.273.732-2.728 1.169-4.273 1.169-.402 0-.798-.041-1.18-.123Zm6.84-2.165c-.085-.503-.541-3.001-1.665-6.084 2.677-.428 5.022.265 5.314.359a8.484 8.484 0 0 1-3.65 5.725Z" />
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    brandClass: 'bg-utility-blue-700 text-white hover:bg-utility-blue-800',
    glyph: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
      </svg>
    ),
  },
  figma: {
    label: 'Figma',
    brandClass: 'bg-utility-neutral-900 text-white hover:bg-utility-neutral-800',
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4Z" fill="#0ACF83" />
        <path d="M4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4Z" fill="#A259FF" />
        <path d="M4 4c0-2.208 1.792-4 4-4h4v8H8C5.792 8 4 6.208 4 4Z" fill="#F24E1E" />
        <path d="M12 0h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0Z" fill="#FF7262" />
        <path d="M20 12c0 2.208-1.792 4-4 4s-4-1.792-4-4 1.792-4 4-4 4 1.792 4 4Z" fill="#1ABCFE" />
      </svg>
    ),
  },
  google: {
    label: 'Google',
    // Google's primary brand colour (#4285F4 ≈ utility-blue-500). Using
    // the brand bg matches the visual treatment of Apple / Facebook /
    // Dribbble / Twitter / Figma — all 6 brand-styled buttons surface
    // the provider's colour. (Google's own "Sign-In" guidelines spec a
    // white bg with the multicolour G mark; consumers who need that
    // exact pattern can pass `style='black-outline'` for the
    // light-surface variant.)
    brandClass: 'bg-utility-blue-500 text-white hover:bg-utility-blue-600',
    glyph: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.545 12.151V9.6h8.728c.109.522.182 1.002.182 1.673 0 4.873-3.275 8.327-8.91 8.327A9.636 9.636 0 0 1 2.91 9.964 9.636 9.636 0 0 1 12.545.327c2.691 0 4.946.964 6.728 2.6l-2.582 2.582c-.764-.728-2.073-1.51-4.146-1.51-3.546 0-6.437 2.945-6.437 6.964s2.891 6.964 6.437 6.964c4.109 0 5.65-2.945 5.891-4.473h-5.891v-1.303Z" />
      </svg>
    ),
  },
  twitter: {
    label: 'Twitter',
    brandClass: 'bg-utility-neutral-900 text-white hover:bg-utility-neutral-800',
    glyph: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
    ),
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
  const glyph = <span className={joinClasses(sizeTokens.glyph, 'shrink-0')}>{tokens.glyph}</span>;
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
