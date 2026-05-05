// Glaon payment-icon registry — Phase D.2 of the icon registry
// rollout (#309 / #368). Per-method SVG glyphs for the canonical
// payment marks Glaon ships, paired with a typed `paymentCatalog`
// array that powers the Storybook catalog page and a
// `paymentIconForBrand` helper that `<Input variant="payment">`
// (#313) and `<Table.Cell.PaymentIcon>` (#324 Phase A) call to
// swap their neutral `CreditCard02` placeholder for per-brand
// artwork.
//
// Phase scope:
//   - **D.2.a (this) :** Card networks — Visa, MasterCard, AMEX,
//                        Discover, JCB, UnionPay.
//   - D.2.b (next)   :   Digital wallets — ApplePay, GooglePay,
//                        SamsungPay, AmazonPay, PayPal, Venmo,
//                        ShopPay, LinkPay.
//   - D.2.c          :   BNPL — Affirm, Afterpay, Klarna, Sezzle,
//                        Zip, Splitit.
//   - D.2.d          :   Regional rails — Alipay, WeChat,
//                        MercadoPago, iDEAL, Bancontact, Sofort, …
//
// Each glyph component accepts the narrow `PaymentIconProps`
// (`className`, `aria-hidden` default true, `aria-label`). Payment
// glyphs are inherently multi-colour and ship fixed brand fills
// per each platform's brand spec — they do NOT inherit
// `currentColor` because brand reproduction rules require the
// canonical artwork on every surface.

import type { ComponentType } from 'react';

import { Amex } from './networks/Amex';
import { Discover } from './networks/Discover';
import { Jcb } from './networks/Jcb';
import { Mastercard } from './networks/Mastercard';
import { UnionPay } from './networks/UnionPay';
import { Visa } from './networks/Visa';
import type { PaymentBrand, PaymentIconCatalogEntry, PaymentIconProps } from './types';

// `PaymentBrand` is owned by `<Input>` (#313) and re-exported from
// the package barrel via that primitive — re-exporting it here too
// would collide. Consumers `import { type PaymentBrand } from '@glaon/ui'`.
export type { PaymentIconCatalogEntry, PaymentIconProps } from './types';
export { Amex, Discover, Jcb, Mastercard, UnionPay, Visa };

/**
 * Maps a `PaymentBrand` (the auto-detected card brand from
 * `<Input variant="payment">`) to the registry's per-brand glyph
 * component. Returns `undefined` when the brand is unknown so
 * consumers can fall back to a neutral credit-card icon.
 *
 * `<Input variant="payment">` calls this internally to swap its
 * leading glyph; consumers who detect the brand upstream (server-
 * side card-on-file rendering, etc.) can call it directly.
 */
export function paymentIconForBrand(
  brand: PaymentBrand,
): ComponentType<PaymentIconProps> | undefined {
  switch (brand) {
    case 'visa':
      return Visa;
    case 'mastercard':
      return Mastercard;
    case 'amex':
      return Amex;
    case 'discover':
      return Discover;
    case 'unknown':
    default:
      return undefined;
  }
}

/**
 * Searchable catalog used by the `Foundations / Payment Icons`
 * Storybook docs page. Order is alphabetical within each category
 * so the rendered grid stays predictable for snapshot tests.
 * Future phases (D.2.b–d) append.
 */
export const paymentCatalog: readonly PaymentIconCatalogEntry[] = [
  { id: 'amex', label: 'American Express', category: 'networks', Icon: Amex },
  { id: 'discover', label: 'Discover', category: 'networks', Icon: Discover },
  { id: 'jcb', label: 'JCB', category: 'networks', Icon: Jcb },
  { id: 'mastercard', label: 'Mastercard', category: 'networks', Icon: Mastercard },
  { id: 'unionpay', label: 'UnionPay', category: 'networks', Icon: UnionPay },
  { id: 'visa', label: 'Visa', category: 'networks', Icon: Visa },
];
