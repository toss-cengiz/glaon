// Vercel triangle glyph. Single-colour via `currentColor` —
// Vercel's brand surface is canonical black bg + white triangle.

import type { IntegrationIconProps } from './types';

export function Vercel({
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
      <path d="M12 1.6 23.6 22.4H.4L12 1.6Z" />
    </svg>
  );
}
