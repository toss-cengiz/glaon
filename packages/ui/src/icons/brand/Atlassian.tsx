// Atlassian chevron mark — the two-mountain-peak glyph used across
// Atlassian properties (Jira, Confluence, Trello brand bar etc.).
// Multi-color brand glyph — ships fixed brand fills (Atlassian's
// canonical blue gradient) so this does NOT inherit `currentColor`.
// Place on a white or neutral surface so the gradient blue reads.

import type { BrandIconProps } from './types';

export function Atlassian({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <defs>
        <linearGradient
          id="atlassian-grad"
          x1="11.85"
          y1="11.49"
          x2="6.49"
          y2="20.78"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0052CC" />
          <stop offset="0.92" stopColor="#2684FF" />
        </linearGradient>
      </defs>
      <path
        d="M7.12 11.41a.55.55 0 0 0-.93.16L.05 23.81a.57.57 0 0 0 .51.81h8.41a.55.55 0 0 0 .51-.31c1.81-3.74.71-9.43-2.36-12.9Z"
        fill="url(#atlassian-grad)"
      />
      <path
        d="M11.55.5a12.4 12.4 0 0 0-.72 12.25l4.13 8.26a.57.57 0 0 0 .51.31h8.41a.57.57 0 0 0 .51-.81S13.07.79 12.49.51a.46.46 0 0 0-.94-.01Z"
        fill="#2684FF"
      />
    </svg>
  );
}
