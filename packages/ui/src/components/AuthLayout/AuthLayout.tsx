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
   * Optional override for the brand logo at the top-left. Defaults to
   * the standard `<Logo />` primitive at `md` size; pass `null` to
   * suppress the logo (e.g. when AuthLayout sits inside another shell).
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
   * Optional footer rendered at the bottom of the form column.
   * Typically `© Glaon {year}` on the auth flows.
   */
  footerSlot?: ReactNode;
  /** Form contents — title, fields, CTAs. */
  children: ReactNode;
}

export function AuthLayout({
  variant = 'split',
  logoSlot,
  imageSlot,
  iconSlot,
  footerSlot,
  children,
}: AuthLayoutProps) {
  const logo = logoSlot === undefined ? <Logo size="md" /> : logoSlot;

  if (variant === 'centered') {
    return (
      <div className="flex min-h-screen flex-col bg-primary">
        <header className="flex items-start px-6 py-6 sm:px-10 sm:py-8">{logo}</header>
        <main className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="flex w-full max-w-[400px] flex-col items-center gap-6 text-center">
            {iconSlot !== undefined && iconSlot !== null && (
              <div className="flex items-center justify-center" aria-hidden="true">
                {iconSlot}
              </div>
            )}
            {children}
          </div>
        </main>
        {footerSlot !== undefined && footerSlot !== null && (
          <footer className="px-6 py-6 text-sm text-tertiary sm:px-10">{footerSlot}</footer>
        )}
      </div>
    );
  }

  // split
  const showImage = imageSlot !== undefined && imageSlot !== null;
  return (
    <div className="flex min-h-screen flex-col bg-primary lg:flex-row">
      <section className="flex flex-1 flex-col px-6 py-6 sm:px-10 sm:py-8 lg:max-w-[720px]">
        <header>{logo}</header>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-[360px] flex-col gap-6">{children}</div>
        </div>
        {footerSlot !== undefined && footerSlot !== null && (
          <footer className="text-sm text-tertiary">{footerSlot}</footer>
        )}
      </section>
      {showImage && (
        <aside className="hidden flex-1 lg:block" aria-hidden="true">
          <div className="h-full p-4">
            <div className="h-full w-full overflow-hidden rounded-3xl">{imageSlot}</div>
          </div>
        </aside>
      )}
    </div>
  );
}
