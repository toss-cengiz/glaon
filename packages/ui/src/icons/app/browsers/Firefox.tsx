// Firefox browser glyph. Multi-colour gradient (orange flame + dark
// brown fox tail) is Firefox's identity; canonical fills are
// hard-coded so `currentColor` is ignored. We approximate the
// gradient with two solid fills — sufficient at icon scale.

import type { AppIconProps } from '../types';

export function Firefox({ className, 'aria-hidden': ariaHidden = true, ...rest }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        fill="#FF7139"
        d="M21.62 8.45c-.41-.99-1.24-2.04-1.89-2.37.34.65.5 1.31.62 1.7l.01.02C19.4 5.32 18.18 4.4 17.2 2.86c-.05-.08-.1-.16-.15-.24-.03-.05-.05-.1-.07-.16a1.31 1.31 0 0 1-.06-.18S16.92.05 16.92.04c0 0-2.16 2.4-2.93 4.6-.45 1.27-.27 1.93-.27 1.93s-1.05-1.27-2.6-.84c-1.55.42-3.16 1.7-2.7 4.36.49 2.84 3.6 4.66 6.9 5 .41.04.83.06 1.25.06.4 0 .8-.02 1.2-.05A9.02 9.02 0 0 1 12 21a9 9 0 0 1-7.05-3.41 7.51 7.51 0 0 0 1.85 1.4c1.25.69 2.66 1.07 4.08 1.1.06 0 .11.01.17.01.3.07-.13-.32-.43-.62-.7-.7-1.21-1.7-1.5-2.69 1.66 2.71 4.96 3.96 8.27 3.5 1.4-.2 2.69-.84 3.79-1.74A10 10 0 0 0 22 12c0-1.27-.13-2.45-.38-3.55Z"
      />
      <path
        fill="#E66000"
        d="M2.6 13.84c-.45-1.4-.65-2.86-.6-4.34a8.43 8.43 0 0 1 1.34-4.13 8.66 8.66 0 0 1 4.41-3.4l.34-.1c-.2.74-.45 1.46-.74 2.16-.27.7-.6 1.37-1 2-.27.42-.57.81-.92 1.16-.5.5-1.04.96-1.6 1.4 0 0 .25 1.16.51 1.62.42.74.93 1.42 1.5 2.04.61.65 1.27 1.26 1.99 1.79l.06.05c.38.27.78.51 1.2.71-.45.04-.92.05-1.4 0-1.45-.15-2.83-.74-3.92-1.69a7.66 7.66 0 0 1-1.17-1.27Z"
      />
    </svg>
  );
}
