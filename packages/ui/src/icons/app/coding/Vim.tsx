// Vim editor glyph. Green diamond with white "VIM" wordmark is the
// canonical brand mark; fill colours are hard-coded.

import type { AppIconProps } from '../types';

export function Vim({ className, 'aria-hidden': ariaHidden = true, ...rest }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <path fill="#019733" d="M12 1.5 1.5 12 12 22.5 22.5 12Z" />
      <path
        fill="#FFFFFF"
        d="M9 16.5h-.6L5.5 9.6h-.7v-.9h2.7v.9h-.7l1.9 4.7 2.1-4.7h-.7v-.9h2.4v.9h-.6l-2.9 6.9Zm5.7 0h-1.7v-.7h.5V9.6h-.5v-.9h1.7v7.1h.5v.7Zm5.5 0h-1.7v-.7h.4v-3.7c0-.4-.06-.66-.18-.78-.12-.13-.32-.19-.6-.19a1.27 1.27 0 0 0-.91.42 1.42 1.42 0 0 0-.4 1.02v3.23h.42v.67h-1.55v-.67h.4v-4.51h-.4v-.7h1.13v.85a1.7 1.7 0 0 1 1.55-.92c.4 0 .72.1.95.32.23.21.36.5.4.86a1.7 1.7 0 0 1 1.59-1.18c.4 0 .72.1.95.31.22.22.34.52.34.91v4.06h.4v.67Z"
      />
    </svg>
  );
}
