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
//   - D.2.a (#377 ✓): Card networks — Visa, MasterCard, AMEX,
//                     Discover, JCB, UnionPay.

//   - D.2.b (#381 ✓): Digital wallets — ApplePay, GooglePay,
//                     SamsungPay, AmazonPay, PayPal, Venmo,
//                     ShopPay, LinkPay.
//   - D.2.c (#384 ⏳): BNPL — Affirm, Afterpay, Klarna, Sezzle,
//                     Zip, Splitit.
//   - **D.2.d (this):** Regional rails — Alipay, WeChat Pay,
//                       MercadoPago, iDEAL, Bancontact, SOFORT.
//
// Each glyph component accepts the narrow `PaymentIconProps`
// (`className`, `aria-hidden` default true, `aria-label`). Payment
// glyphs are inherently multi-colour and ship fixed brand fills
// per each platform's brand spec — they do NOT inherit
// `currentColor` because brand reproduction rules require the
// canonical artwork on every surface.

import type { ComponentType } from 'react';

import { Affirm } from './bnpl/Affirm';
import { Afterpay } from './bnpl/Afterpay';
import { Klarna } from './bnpl/Klarna';
import { Sezzle } from './bnpl/Sezzle';
import { Splitit } from './bnpl/Splitit';
import { Zip } from './bnpl/Zip';
import { Amex } from './networks/Amex';
import { Discover } from './networks/Discover';
import { Jcb } from './networks/Jcb';
import { Mastercard } from './networks/Mastercard';
import { UnionPay } from './networks/UnionPay';
import { Visa } from './networks/Visa';
import { Alipay } from './regional/Alipay';
import { Bancontact } from './regional/Bancontact';
import { Ideal } from './regional/Ideal';
import { MercadoPago } from './regional/MercadoPago';
import { Sofort } from './regional/Sofort';
import { WeChatPay } from './regional/WeChatPay';
import { AmazonPay } from './wallets/AmazonPay';
import { ApplePay } from './wallets/ApplePay';
import { GooglePay } from './wallets/GooglePay';
import { LinkPay } from './wallets/LinkPay';
import { PayPal } from './wallets/PayPal';
import { SamsungPay } from './wallets/SamsungPay';
import { ShopPay } from './wallets/ShopPay';
import { Venmo } from './wallets/Venmo';
import type { PaymentBrand, PaymentIconCatalogEntry, PaymentIconProps } from './types';

// `PaymentBrand` is owned by `<Input>` (#313) and re-exported from
// the package barrel via that primitive — re-exporting it here too
// would collide. Consumers `import { type PaymentBrand } from '@glaon/ui'`.
export type { PaymentIconCatalogEntry, PaymentIconProps } from './types';
export {
  Alipay,
  AmazonPay,
  Amex,
  ApplePay,
  Bancontact,
  Discover,
  GooglePay,
  Ideal,
  Jcb,
  LinkPay,
  Mastercard,
  MercadoPago,
  PayPal,
  SamsungPay,
  ShopPay,
  Sofort,
  UnionPay,
  Venmo,
  Visa,
  WeChatPay
};

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
  // --- D.2.a Networks ---
  { id: 'amex', label: 'American Express', category: 'networks', Icon: Amex },
  { id: 'discover', label: 'Discover', category: 'networks', Icon: Discover },
  { id: 'jcb', label: 'JCB', category: 'networks', Icon: Jcb },
  { id: 'mastercard', label: 'Mastercard', category: 'networks', Icon: Mastercard },
  { id: 'unionpay', label: 'UnionPay', category: 'networks', Icon: UnionPay },
  { id: 'visa', label: 'Visa', category: 'networks', Icon: Visa },
  // --- D.2.c BNPL ---
  { id: 'affirm', label: 'Affirm', category: 'bnpl', Icon: Affirm },
  { id: 'afterpay', label: 'Afterpay', category: 'bnpl', Icon: Afterpay },
  { id: 'klarna', label: 'Klarna', category: 'bnpl', Icon: Klarna },
  { id: 'sezzle', label: 'Sezzle', category: 'bnpl', Icon: Sezzle },
  { id: 'splitit', label: 'Splitit', category: 'bnpl', Icon: Splitit },
  { id: 'zip', label: 'Zip', category: 'bnpl', Icon: Zip },
  // --- D.2.b Wallets ---
  { id: 'amazon-pay', label: 'Amazon Pay', category: 'wallets', Icon: AmazonPay },
  { id: 'apple-pay', label: 'Apple Pay', category: 'wallets', Icon: ApplePay },
  { id: 'google-pay', label: 'Google Pay', category: 'wallets', Icon: GooglePay },
  { id: 'link-pay', label: 'Link', category: 'wallets', Icon: LinkPay },
  { id: 'paypal', label: 'PayPal', category: 'wallets', Icon: PayPal },
  { id: 'samsung-pay', label: 'Samsung Pay', category: 'wallets', Icon: SamsungPay },
  { id: 'shop-pay', label: 'Shop Pay', category: 'wallets', Icon: ShopPay },
  { id: 'venmo', label: 'Venmo', category: 'wallets', Icon: Venmo },
  // --- D.2.d Regional rails ---
  { id: 'alipay', label: 'Alipay', category: 'regional', Icon: Alipay },
  { id: 'bancontact', label: 'Bancontact', category: 'regional', Icon: Bancontact },
  { id: 'ideal', label: 'iDEAL', category: 'regional', Icon: Ideal },
  { id: 'mercado-pago', label: 'Mercado Pago', category: 'regional', Icon: MercadoPago },
  { id: 'sofort', label: 'SOFORT', category: 'regional', Icon: Sofort },
  { id: 'wechat-pay', label: 'WeChat Pay', category: 'regional', Icon: WeChatPay },
];
