// Bolt (StackBlitz Bolt) lightning glyph. Single-colour via
// `currentColor` — Bolt's brand surface is a black bg with white
// glyph, but the single-colour path means consumers can recolour
// for any context.

import type { IntegrationIconProps } from './types';

export function Bolt({
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
      <path d="M13 2 3 14h7l-2 8 12-14h-7l1-6Z" />
    </svg>
  );
}
