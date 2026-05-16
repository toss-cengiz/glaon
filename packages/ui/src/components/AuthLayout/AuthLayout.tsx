// Glaon AuthLayout — page chrome for the four auth flows (#469).
//
// Two variants drawn from Figma's Design System file:
//   - `split` — Login + Sign-up: left-side card + right-side hero
//     image; collapses to a single centered column below the `lg`
//     breakpoint so phones still get the form full-width.
//   - `centered` — Forgot password + Email verification: single card
//     with an optional FeaturedIcon-style icon slot on top.
//
// AuthLayout is purely presentational — no async state, no fetch,
// no router knowledge. The route component renders it and feeds in
// the form via children.

import type { ReactNode } from 'react';

import { Logo } from '../Logo';

export type AuthLayoutVariant = 'split' | 'centered';

export interface AuthLayoutProps {
  /**
   * Layout variant. Mirrors Figma's `Section=Cloud/Device` (split) and
   * Forgot-password / Email-verification (centered) frames.
   * @default 'split'
   */
  variant?: AuthLayoutVariant;
  /**
   * Page title rendered as `<h1>` above the form. When set, AuthLayout
   * also renders the standard `flex flex-col gap-3` header wrapper —
   * pages no longer hand-roll the heading + subtitle stack. Pass
   * `null` (or omit) for screens that want full control of the header
   * area (e.g. centered variant with a custom icon block).
   */
  title?: ReactNode;
  /**
   * Secondary text rendered under `title`. Ignored when `title` is
   * unset.
   */
  subtitle?: ReactNode;
  /**
   * Override for the brand logo at the top-left. Defaults to
   * `<Logo size={133} />` — the pixel size measured from Figma node
   * `1267:132204`. Pass `null` to suppress the logo (e.g. when
   * AuthLayout sits inside another shell).
   */
  logoSlot?: ReactNode;
  /**
   * Hero image rendered next to the form on `split`. Ignored when
   * `variant='centered'`. Pass `null` to render the split layout
   * without the image (the form expands to fill the available space).
   */
  imageSlot?: ReactNode;
  /**
   * Decorative icon rendered above the title on `variant='centered'`.
   * Ignored when `variant='split'`. Use the FeaturedIcon-style block
   * from the kit (key, mail, etc.).
   */
  iconSlot?: ReactNode;
  /**
   * Footer rendered at the bottom of the form column. Defaults to
   * `© Glaon {currentYear}`; pass `null` to suppress, or override with
   * a custom node for legal / build-info chrome.
   */
  footerSlot?: ReactNode;
  /** Form contents — fields, CTAs, social buttons, footer links. */
  children: ReactNode;
}

export function AuthLayout({
  variant = 'split',
  title,
  subtitle,
  logoSlot,
  imageSlot,
  iconSlot,
  footerSlot,
  children,
}: AuthLayoutProps) {
  // Default logo / footer slots — pages can still override per slot,
  // but the common case (LoginPage, SignUpPage, …) gets them for free.
  // `logoSlot === undefined` distinguishes "not set" from "set to
  // null" (the latter suppresses the slot).
  const logo = logoSlot === undefined ? <Logo size={133} /> : logoSlot;
  const footer =
    footerSlot === undefined ? (
      <span>© Glaon {new Date().getFullYear().toString()}</span>
    ) : (
      footerSlot
    );

  // Shared title + subtitle stack. Pages that pass a `title` prop
  // skip hand-rolling the `<header>` — keeps Figma-spec typography
  // (`text-display-xs font-semibold` + `text-md text-tertiary`,
  // gap-3) on one source line. Named `titleBlock` rather than
  // `header` because the centered variant already uses the `<header>`
  // element as the logo container at the top of the page.
  const titleBlock =
    title !== undefined && title !== null ? (
      <header className="flex flex-col gap-3">
        <h1 className="text-display-xs font-semibold text-primary">{title}</h1>
        {subtitle !== undefined && subtitle !== null && (
          <p className="text-md text-tertiary">{subtitle}</p>
        )}
      </header>
    ) : null;

  if (variant === 'centered') {
    return (
      <div className="flex min-h-screen flex-col bg-primary">
        {logo !== null && (
          <header className="flex items-start px-6 py-6 sm:px-10 sm:py-8">{logo}</header>
        )}
        <main className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="flex w-full max-w-[400px] flex-col items-center gap-6 text-center">
            {iconSlot !== undefined && iconSlot !== null && (
              <div className="flex items-center justify-center" aria-hidden="true">
                {iconSlot}
              </div>
            )}
            {titleBlock}
            {children}
          </div>
        </main>
        {footer !== null && (
          <footer className="px-6 py-6 text-sm text-tertiary sm:px-10">{footer}</footer>
        )}
      </div>
    );
  }

  // split — mirrors Figma node 1267:132204 (Design-System / Log in /
  // Desktop × Cloud) pixel-for-pixel at `lg` and up:
  //   - Page: `lg:h-screen lg:overflow-hidden` — Figma's frame is
  //     exactly 100vh with no document scroll. The form column gets
  //     `lg:overflow-y-auto` as a safety valve so a very short
  //     desktop window scrolls inside the column rather than pushing
  //     the document past 100vh (#514). Below `lg` we keep
  //     `min-h-screen` and allow normal vertical document scroll for
  //     mobile legibility.
  //   - Form column: `min-w-[480px]`, vertically centered, with
  //     absolutely positioned logo (top-8 left-8 → 32/32px) and
  //     footer (bottom-8 left-8 → 32/32px). The form content itself
  //     sits in a `max-w-[360px]` column.
  //   - Hero column: full-bleed image with only the left corners
  //     rounded at 80px (`rounded-tl-[80px] rounded-bl-[80px]`),
  //     no padding wrapper. A subtle bottom-darkening gradient
  //     overlay reproduces the Figma frame's `to-black/10 at 79%`
  //     treatment.
  // Below `lg`, the hero column collapses (the form takes full width)
  // so the mobile auth screens stay legible.
  const showImage = imageSlot !== undefined && imageSlot !== null;
  return (
    <div className="flex min-h-screen flex-col bg-primary lg:h-screen lg:min-h-0 lg:flex-row lg:items-stretch lg:overflow-hidden">
      <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-24 sm:px-10 lg:min-w-[480px] lg:overflow-y-auto lg:py-8">
        {logo !== null && <div className="absolute left-6 top-6 sm:left-8 sm:top-8">{logo}</div>}

        <div className="flex w-full max-w-[360px] flex-col gap-8">
          {titleBlock}
          {children}
        </div>

        {footer !== null && (
          <footer className="absolute bottom-6 left-6 text-sm text-tertiary sm:bottom-8 sm:left-8">
            {footer}
          </footer>
        )}
      </section>
      {showImage && (
        <aside
          className="relative hidden flex-1 overflow-hidden rounded-tl-[80px] rounded-bl-[80px] lg:block lg:h-full lg:min-w-[640px]"
          aria-hidden="true"
        >
          {imageSlot}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
        </aside>
      )}
    </div>
  );
}
