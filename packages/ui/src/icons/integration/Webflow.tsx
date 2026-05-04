// Webflow `W` glyph. Single-colour via `currentColor`.

import type { IntegrationIconProps } from './types';

export function Webflow({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: IntegrationIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={ariaHidden}
      className={className}
      {...rest}
    >
      <path d="M24 4.515 13.587 20.485h-2.997l4.31-8.345a48.95 48.95 0 0 1-5.04 8.345H6.85L2.97 4.515h3.21l1.785 8.85a52.66 52.66 0 0 1 4.59-8.85h2.7l1.65 8.49 4.245-8.49H24Z" />
    </svg>
  );
}
