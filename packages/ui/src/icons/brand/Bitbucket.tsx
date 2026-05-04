// Bitbucket bucket glyph. Multi-color brand mark — ships fixed
// brand fills (Atlassian's blue gradient + the white bucket-band)
// so this does NOT inherit `currentColor`. Pairs with white or
// neutral surfaces so the gradient reads cleanly.

import type { BrandIconProps } from './types';

export function Bitbucket({
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <defs>
        <linearGradient
          id="bitbucket-grad"
          x1="22.03"
          y1="9.86"
          x2="11.43"
          y2="18.04"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.18" stopColor="#0052CC" />
          <stop offset="1" stopColor="#2684FF" />
        </linearGradient>
      </defs>
      <path
        d="M.778 1.213a.768.768 0 0 0-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 0 0 .77-.646l3.27-20.03a.768.768 0 0 0-.768-.891zM14.52 14.563H9.418L8.04 7.351h7.7z"
        fill="#2684FF"
      />
      <path
        d="M22.943 7.351h-7.207l-1.222 7.212H9.418l-5.895 6.997c.187.16.425.249.671.252H19.95a.772.772 0 0 0 .77-.646Z"
        fill="url(#bitbucket-grad)"
      />
    </svg>
  );
}
