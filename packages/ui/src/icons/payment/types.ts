// Shared prop contract for every payment-method glyph component.
// Mirrors `BrandIconProps` in spirit but uses a 32×24 viewBox by
// default (matches the canonical credit-card aspect ratio you see
// in payment forms — wider than tall). Consumers can resize via
// `className` (e.g. `size-6` for square slots, `h-6` to preserve
// the 4:3 ratio).

import type { ReactNode } from 'react';

export interface PaymentIconProps {
  /** Tailwind override hook for the rendered `<svg>`. */
  className?: string;
  /**
   * Whether the icon is decorative. Defaults to `true` because
   * payment glyphs typically pair with the masked card number or
   * a saved-card label — the visible text carries the meaning.
   * Override to `false` and pair with `aria-label` for standalone
   * usage (e.g. a payment-method picker tile).
   * @default true
   */
  'aria-hidden'?: boolean;
  /** Accessible label override for standalone usage. */
  'aria-label'?: string;
}

export interface PaymentIconCatalogEntry {
  /** Stable identifier — kebab-case, matches the export name lowercased. */
  id: string;
  /** Human-readable label rendered in the catalog grid. */
  label: string;
  /** Catalog category for filter chips (`networks`, `wallets`, `bnpl`, `regional`). */
  category: 'networks' | 'wallets' | 'bnpl' | 'regional';
  /** Component to render. */
  Icon: (props: PaymentIconProps) => ReactNode;
}

// Note: the canonical `PaymentBrand` type lives on `<Input>` (#313)
// where it's surfaced to consumers via `onPaymentBrandDetected`.
// The registry's `paymentIconForBrand` helper accepts the same
// union via this internal type alias — re-exporting it from the
// package barrel would collide with Input's own export.
export type PaymentBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
