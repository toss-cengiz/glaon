// Eyes emoji — two filled eyes peering. Multi-color (white sclera +
// black pupil); ships fixed fills.

import type { EmojiIconProps } from './types';

export function Eyes({ className, 'aria-hidden': ariaHidden = true, ...rest }: EmojiIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <ellipse cx="7" cy="12" rx="4" ry="5" fill="#FAFAFA" stroke="#171717" strokeWidth="1" />
      <ellipse cx="17" cy="12" rx="4" ry="5" fill="#FAFAFA" stroke="#171717" strokeWidth="1" />
      <circle cx="7" cy="13" r="2" fill="#171717" />
      <circle cx="17" cy="13" r="2" fill="#171717" />
    </svg>
  );
}
