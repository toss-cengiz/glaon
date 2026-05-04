// GitLab tanuki glyph. Multi-color brand mark — ships fixed brand
// fills (the canonical orange / gold / red triad) so unlike single-
// color brand glyphs this does NOT inherit `currentColor`. Place
// on a contrasting surface — the `SocialButton` wrap pairs it with
// either `bg-utility-neutral-900` (dark surface) or
// `bg-utility-orange-600` (brand surface).

import type { BrandIconProps } from './types';

export function Gitlab({ className, 'aria-hidden': ariaHidden = true, ...rest }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        d="m23.955 13.587-1.342-4.135-2.664-8.189a.455.455 0 0 0-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 0 0-.867 0L1.387 9.452.045 13.587a.924.924 0 0 0 .331 1.023L12 23.054l11.624-8.443a.924.924 0 0 0 .331-1.024"
        fill="#E24329"
      />
      <path d="M12 23.054 16.418 9.45H7.582L12 23.054Z" fill="#FC6D26" />
      <path d="M12 23.054 7.582 9.45H1.387L12 23.054Z" fill="#FCA326" />
      <path
        d="M1.387 9.452.045 13.587a.92.92 0 0 0 .331 1.023L12 23.054 1.387 9.452Z"
        fill="#E24329"
      />
      <path d="M1.387 9.452h6.195L4.917 1.263a.455.455 0 0 0-.866 0L1.387 9.452Z" fill="#FC6D26" />
      <path d="M12 23.054 16.418 9.45h6.195L12 23.054Z" fill="#FCA326" />
      <path
        d="m22.613 9.452 1.342 4.135a.92.92 0 0 1-.331 1.023L12 23.054l10.613-13.602Z"
        fill="#E24329"
      />
      <path
        d="M22.613 9.452h-6.195l2.664-8.189a.455.455 0 0 1 .867 0l2.664 8.189Z"
        fill="#FC6D26"
      />
    </svg>
  );
}
