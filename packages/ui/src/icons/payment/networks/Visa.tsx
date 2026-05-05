// Visa card-network glyph. Multi-color brand mark — ships fixed
// brand fills (the canonical white surface + Visa-blue wordmark)
// per Visa's brand-CTA spec. Use inside `<Input variant="payment">`
// or `<Table.Cell.PaymentIcon>` via the `methodIcon` override.

import type { PaymentIconProps } from '../types';

export function Visa({ className, 'aria-hidden': ariaHidden = true, ...rest }: PaymentIconProps) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <rect width="32" height="24" rx="3" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="0.5" />
      <path
        d="M14.6 8.5h-1.7l-1.06 6.9H13.5l1.1-6.9Zm5.4 4.4-.92-3.45a.5.5 0 0 0-.48-.36h-1.7l-.04.18c1.5.34 2.49.94 2.93 1.78l.21 1.85Zm-2.6-2.94c-.69-.13-1.38.16-1.93.5-.27-.94-.85-1.5-1.74-1.62l-.05.18c1.4.36 2.16 1.16 2.32 2.46.13 1.03-.46 1.81-1.34 2.42l1.5-.46.46-1.62c.18-.45.49-.79.94-.94l-.16 1.06h1.42l1.06-1.84-2.48-.14ZM23.5 8.5h-1.36c-.32 0-.6.2-.7.5l-2.45 6.4h1.7s.28-.78.34-.95h2.07c.05.21.18.95.18.95h1.5l-1.28-6.9Zm-1.97 4.5c.13-.36.65-1.78.65-1.78 0 .02.13-.36.21-.6l.11.55s.31 1.5.38 1.83h-1.35Zm-12.91 2.4 1.86-6.9h1.79l-1.85 6.9H8.62Zm-3.4-3.94c0 1.5 1.34 2.34 2.36 2.84 1.05.51 1.4.84 1.4 1.3-.01.7-.83.81-1.6.83-.66.02-1.34-.09-1.95-.27l-.31-.16-.32 1.66c.66.31 1.41.49 2.21.5 2.07 0 3.42-1.02 3.43-2.61.01-.85-.43-1.5-1.51-2.04-.66-.34-1.06-.57-1.06-.92 0-.31.35-.65 1.1-.65.62-.01 1.07.12 1.43.27l.21.09.32-1.61c-.39-.15-1-.31-1.78-.31-1.97 0-3.36 1.05-3.37 2.55Z"
        fill="#1A1F71"
      />
    </svg>
  );
}
