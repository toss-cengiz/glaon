// Glaon brand-icon registry — Phase A + A.2.* rollout (#309).
// Inline SVG components for every platform glyph `@glaon/ui`
// ships, paired with a typed `brandCatalog` array that powers the
// Storybook catalog page.
//
// Tier scoping for the rollout (see #365):
//   - Phase A     (#322 ✓): Apple, Dribbble, Facebook, Figma,
//                            Google, Twitter — six platforms
//                            consumed by the original `<SocialButton>`.
//   - Phase A.2.1 (#372 ✓): GitHub, GitLab, Microsoft, LinkedIn,
//                            Discord, Slack — Tier-1 auth providers.
//   - Phase A.2.2 (this) :  Notion, Trello, Asana, Atlassian,
//                            Bitbucket, Telegram — collaboration.
//   - Phase A.2.3 (next) :  AngelList, Clubhouse, Dropbox, Medium,
//                            Pinterest, Reddit, Snapchat, Spotify,
//                            Stack Overflow, Tumblr, TikTok, Twitch,
//                            Vimeo, WhatsApp, YouTube, …
//
// Each glyph component accepts the narrow `BrandIconProps`
// (`className`, `aria-hidden`, `aria-label`) so parent buttons /
// links control sizing + accessibility. Single-colour glyphs inherit
// `currentColor`; multi-colour glyphs (Figma, Google, Microsoft,
// GitLab, Slack) ship fixed brand fills per the platform's brand
// spec — they're never recoloured.

import { Apple } from './Apple';
import { Asana } from './Asana';
import { Atlassian } from './Atlassian';
import { Bitbucket } from './Bitbucket';
import { Discord } from './Discord';
import { Dribbble } from './Dribbble';
import { Facebook } from './Facebook';
import { Figma } from './Figma';
import { Github } from './Github';
import { Gitlab } from './Gitlab';
import { Google } from './Google';
import { Linkedin } from './Linkedin';
import { Microsoft } from './Microsoft';
import { Notion } from './Notion';
import { Slack } from './Slack';
import { Telegram } from './Telegram';
import { Trello } from './Trello';
import { Twitter } from './Twitter';
import type { BrandIconCatalogEntry } from './types';

export type { BrandIconCatalogEntry, BrandIconProps } from './types';
export {
  Apple,
  Asana,
  Atlassian,
  Bitbucket,
  Discord,
  Dribbble,
  Facebook,
  Figma,
  Github,
  Gitlab,
  Google,
  Linkedin,
  Microsoft,
  Notion,
  Slack,
  Telegram,
  Trello,
  Twitter,
};

/**
 * Searchable catalog used by the `Foundations / Brand Icons`
 * Storybook docs page. Order is alphabetical so the rendered grid
 * stays predictable; future phases (#309 follow-ups) append to
 * keep the registry stable for snapshot tests.
 */
export const brandCatalog: readonly BrandIconCatalogEntry[] = [
  { id: 'apple', label: 'Apple', Icon: Apple },
  { id: 'asana', label: 'Asana', Icon: Asana },
  { id: 'atlassian', label: 'Atlassian', Icon: Atlassian },
  { id: 'bitbucket', label: 'Bitbucket', Icon: Bitbucket },
  { id: 'discord', label: 'Discord', Icon: Discord },
  { id: 'dribbble', label: 'Dribbble', Icon: Dribbble },
  { id: 'facebook', label: 'Facebook', Icon: Facebook },
  { id: 'figma', label: 'Figma', Icon: Figma },
  { id: 'github', label: 'GitHub', Icon: Github },
  { id: 'gitlab', label: 'GitLab', Icon: Gitlab },
  { id: 'google', label: 'Google', Icon: Google },
  { id: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { id: 'microsoft', label: 'Microsoft', Icon: Microsoft },
  { id: 'notion', label: 'Notion', Icon: Notion },
  { id: 'slack', label: 'Slack', Icon: Slack },
  { id: 'telegram', label: 'Telegram', Icon: Telegram },
  { id: 'trello', label: 'Trello', Icon: Trello },
  { id: 'twitter', label: 'Twitter / X', Icon: Twitter },
];
