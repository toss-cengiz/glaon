// n8n (workflow automation) circles-and-line glyph. Single-colour
// via `currentColor` — n8n's brand spec ships the mark in
// `#EA4B71` (rose) for primary surfaces and any tint elsewhere.

import type { IntegrationIconProps } from './types';

export function N8n({
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
      <path d="M5 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm14 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-7 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-2 3H7v2h3v-2Zm7 0h-3v2h3v-2Z" />
    </svg>
  );
}
