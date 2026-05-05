// WeChat Pay regional-rail glyph. Multi-color brand mark — ships
// fixed brand fills (canonical WeChat-green surface + white
// "WeChat Pay" wordmark) per Tencent's brand-CTA spec.

import type { PaymentIconProps } from '../types';

export function WeChatPay({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#07C160" />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        fontSize="4.4"
        fontWeight="800"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.05"
      >
        WeChat Pay
      </text>
    </svg>
  );
}
