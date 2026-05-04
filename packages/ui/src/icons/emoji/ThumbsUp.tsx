// Thumbs-up emoji. Multi-color (peach skin tone + cuff). The Figma
// frame ships a single skin-tone variant; tone variants are deferred
// to a follow-up if needed.

import type { EmojiIconProps } from './types';

export function ThumbsUp({ className, 'aria-hidden': ariaHidden = true, ...rest }: EmojiIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={ariaHidden} className={className} {...rest}>
      <path
        d="M2 11h4v10H2zM7 11l4-7c.55 0 1 .45 1 1v5h6.92c.99 0 1.78.84 1.69 1.83l-.84 7c-.07.85-.79 1.5-1.65 1.5H7V11Z"
        fill="#FBBF24"
        stroke="#92400E"
        strokeWidth="0.5"
      />
    </svg>
  );
}
