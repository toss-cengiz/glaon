// Claude (Anthropic) starburst glyph. Single-colour via
// `currentColor`. Anthropic's brand spec ships the mark in
// `#D97706` (amber-600) for primary-brand contexts and in
// neutral tones elsewhere; the single-colour path defers to the
// host surface.

import type { IntegrationIconProps } from './types';

export function Claude({
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
      <path d="M12.005 0c1.547.014 2.929.45 4.143 1.31l-.61 5.08-1.453.41a3.96 3.96 0 0 0-2.08-.59 3.93 3.93 0 0 0-3.93 3.93c0 .96.34 1.84.92 2.53L7.39 13.99 2.36 12.41a11.9 11.9 0 0 1-.36-2.93C2 4.246 6.476 0 12.005 0Zm5.31 2.205a11.95 11.95 0 0 1 4.32 6.535L17.21 11.7l-.96-1.16a4.16 4.16 0 0 0 .26-1.43c0-1.32-.61-2.49-1.57-3.27l2.38-3.635Zm4.53 7.44a11.93 11.93 0 0 1-1.59 7.66l-4.41-2.73-.06-1.5c1.49-.68 2.51-2.16 2.51-3.91 0-.18-.01-.36-.03-.54l3.58.97v.05Zm-2.32 9.06a11.95 11.95 0 0 1-7.52 5.295V18l1.42-.55a3.93 3.93 0 0 0 4.41-2.61l3.58.61-1.89 3.255Zm-9.28 5.295A11.95 11.95 0 0 1 1.65 18.74l3.65-3.555 1.46.42a3.93 3.93 0 0 0 3.385 2.985L10.245 24Zm-9.59-7.54a11.95 11.95 0 0 1-.485-7.62l3.69.79c-.04.21-.06.42-.06.63 0 1.55.89 2.89 2.19 3.54l.29 1.5L.655 16.46Z" />
    </svg>
  );
}
