// Glaon emoji-icon registry — Phase D.5 of the icon registry rollout
// (#309 / #371). Inline SVG components for the 18 emoji glyphs from
// Figma's `Emoji` collection ([node 1025-31781](https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1025-31781)),
// paired with a typed `emojiCatalog` array that powers the Storybook
// catalog page.
//
// Why inline SVG (not Unicode emoji)? Unicode emoji render
// differently per OS / font (Apple vs Google vs Microsoft sets
// diverge visually). Inline SVG glyphs ship one canonical look for
// every consumer. For text-with-emoji prose use Unicode (composes
// with surrounding font); for UI affordances (reaction picker,
// status indicators, "look at this!" anchors) use the components
// here.
//
// Each glyph component accepts the narrow `EmojiIconProps`
// (`className`, `aria-hidden` default true, `aria-label`). Emoji
// are inherently multi-colour and ship fixed brand fills — they
// do NOT inherit `currentColor` because the colour IS the meaning
// (e.g. red heart vs green heart carry different semantics).

import { Crown } from './Crown';
import { Eyes } from './Eyes';
import { Fire } from './Fire';
import { HeartBlack } from './HeartBlack';
import { HeartBlue } from './HeartBlue';
import { HeartBrown } from './HeartBrown';
import { HeartGreen } from './HeartGreen';
import { HeartPink } from './HeartPink';
import { HeartPurple } from './HeartPurple';
import { HeartRed } from './HeartRed';
import { HeartSparkle } from './HeartSparkle';
import { HeartWhite } from './HeartWhite';
import { HeartYellow } from './HeartYellow';
import { Rocket } from './Rocket';
import { Sparkles } from './Sparkles';
import { StarFilled } from './StarFilled';
import { StarOutline } from './StarOutline';
import { ThumbsUp } from './ThumbsUp';
import type { EmojiIconCatalogEntry } from './types';

export type { EmojiIconCatalogEntry, EmojiIconProps } from './types';
export {
  Crown,
  Eyes,
  Fire,
  HeartBlack,
  HeartBlue,
  HeartBrown,
  HeartGreen,
  HeartPink,
  HeartPurple,
  HeartRed,
  HeartSparkle,
  HeartWhite,
  HeartYellow,
  Rocket,
  Sparkles,
  StarFilled,
  StarOutline,
  ThumbsUp,
};

/**
 * Searchable catalog used by the `Foundations / Emoji Icons`
 * Storybook docs page. Order is alphabetical by id so the rendered
 * grid stays predictable for snapshot tests.
 */
export const emojiCatalog: readonly EmojiIconCatalogEntry[] = [
  { id: 'crown', label: 'Crown', Icon: Crown },
  { id: 'eyes', label: 'Eyes', Icon: Eyes },
  { id: 'fire', label: 'Fire', Icon: Fire },
  { id: 'heart-black', label: 'Heart (Black)', Icon: HeartBlack },
  { id: 'heart-blue', label: 'Heart (Blue)', Icon: HeartBlue },
  { id: 'heart-brown', label: 'Heart (Brown)', Icon: HeartBrown },
  { id: 'heart-green', label: 'Heart (Green)', Icon: HeartGreen },
  { id: 'heart-pink', label: 'Heart (Pink)', Icon: HeartPink },
  { id: 'heart-purple', label: 'Heart (Purple)', Icon: HeartPurple },
  { id: 'heart-red', label: 'Heart (Red)', Icon: HeartRed },
  { id: 'heart-sparkle', label: 'Heart (Sparkle)', Icon: HeartSparkle },
  { id: 'heart-white', label: 'Heart (White)', Icon: HeartWhite },
  { id: 'heart-yellow', label: 'Heart (Yellow)', Icon: HeartYellow },
  { id: 'rocket', label: 'Rocket', Icon: Rocket },
  { id: 'sparkles', label: 'Sparkles', Icon: Sparkles },
  { id: 'star-filled', label: 'Star (Filled)', Icon: StarFilled },
  { id: 'star-outline', label: 'Star (Outline)', Icon: StarOutline },
  { id: 'thumbs-up', label: 'Thumbs Up', Icon: ThumbsUp },
];
