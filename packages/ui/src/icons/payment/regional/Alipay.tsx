// Alipay regional-rail glyph. Multi-color brand mark — ships fixed
// brand fills (canonical Alipay-blue surface + white "支付宝" or
// "Alipay" wordmark) per Alipay's brand-CTA spec. We use the
// Latin "Alipay" wordmark for international payment forms.

import type { PaymentIconProps } from '../types';

export function Alipay({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#1677FF" />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        fontSize="6"
        fontWeight="800"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.05"
      >
        Alipay
      </text>
    </svg>
  );
}
