// Gemini four-pointed star glyph. Single-colour via `currentColor`
// — Google's brand spec ships the mark in a blue gradient for
// product-listing contexts but defers to monochrome in dense
// tables, search results, etc.

import type { IntegrationIconProps } from './types';

export function Gemini({
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
      <path d="M12 0c.5 5 4.5 9 11 11.5-6.5 2.5-10.5 6.5-11 12.5-.5-6-4.5-10-11-12.5C7.5 9 11.5 5 12 0Z" />
    </svg>
  );
}
