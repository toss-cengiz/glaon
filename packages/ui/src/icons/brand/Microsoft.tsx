// Microsoft 4-square glyph. Per Microsoft's brand spec the four
// quadrants are fixed brand colors (#F25022 red, #7FBA00 green,
// #00A4EF blue, #FFB900 yellow); the component ships fixed fills
// and ignores `currentColor`. Pairs with `<SocialButton
// brand="microsoft">` for OAuth sign-in.

import type { BrandIconProps } from './types';

export function Microsoft({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <path d="M2 2h9.5v9.5H2z" fill="#F25022" />
      <path d="M12.5 2H22v9.5h-9.5z" fill="#7FBA00" />
      <path d="M2 12.5h9.5V22H2z" fill="#00A4EF" />
      <path d="M12.5 12.5H22V22h-9.5z" fill="#FFB900" />
    </svg>
  );
}
