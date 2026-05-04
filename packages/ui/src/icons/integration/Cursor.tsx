// Cursor editor glyph (the canonical chevron-arrow mark). Single-
// colour via `currentColor`.

import type { IntegrationIconProps } from './types';

export function Cursor({
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
      <path d="M11.925.025 22.806 6.31v11.378l-10.881 6.286V12.595L1.85 6.31 11.925.025Zm0 13.94 10.881-6.286V18.97l-10.881-6.286V13.965Z" />
    </svg>
  );
}
