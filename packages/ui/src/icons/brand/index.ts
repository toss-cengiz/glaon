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
//   - Phase A.2.2 (#373 ✓): Notion, Trello, Asana, Atlassian,
//                            Bitbucket, Telegram — collaboration.
//   - Phase A.2.3 (this) :  AngelList, Clubhouse, Dropbox, Medium,
//                            Pinterest, Reddit, Snapchat, Spotify,
//                            Stack Overflow, Tumblr, TikTok, Twitch,
//                            Vimeo, WhatsApp, YouTube — long tail.
//                            Closes #365.
//
// Each glyph component accepts the narrow `BrandIconProps`
// (`className`, `aria-hidden`, `aria-label`) so parent buttons /
// links control sizing + accessibility. Single-colour glyphs inherit
// `currentColor`; multi-colour glyphs (Figma, Google, Microsoft,
// GitLab, Slack) ship fixed brand fills per the platform's brand
// spec — they're never recoloured.

import { AngelList } from './AngelList';
import { Apple } from './Apple';
import { Asana } from './Asana';
import { Atlassian } from './Atlassian';
import { Bitbucket } from './Bitbucket';
import { Clubhouse } from './Clubhouse';
import { Discord } from './Discord';
import { Dribbble } from './Dribbble';
import { Dropbox } from './Dropbox';
import { Facebook } from './Facebook';
import { Figma } from './Figma';
import { Github } from './Github';
import { Gitlab } from './Gitlab';
import { Google } from './Google';
import { Linkedin } from './Linkedin';
import { Medium } from './Medium';
import { Microsoft } from './Microsoft';
import { Notion } from './Notion';
import { Pinterest } from './Pinterest';
import { Reddit } from './Reddit';
import { Slack } from './Slack';
import { Snapchat } from './Snapchat';
import { Spotify } from './Spotify';
import { StackOverflow } from './StackOverflow';
import { Telegram } from './Telegram';
import { TikTok } from './TikTok';
import { Trello } from './Trello';
import { Tumblr } from './Tumblr';
import { Twitch } from './Twitch';
import { Twitter } from './Twitter';
import { Vimeo } from './Vimeo';
import { WhatsApp } from './WhatsApp';
import { YouTube } from './YouTube';
import type { BrandIconCatalogEntry } from './types';

export type { BrandIconCatalogEntry, BrandIconProps } from './types';
export {
  AngelList,
  Apple,
  Asana,
  Atlassian,
  Bitbucket,
  Clubhouse,
  Discord,
  Dribbble,
  Dropbox,
  Facebook,
  Figma,
  Github,
  Gitlab,
  Google,
  Linkedin,
  Medium,
  Microsoft,
  Notion,
  Pinterest,
  Reddit,
  Slack,
  Snapchat,
  Spotify,
  StackOverflow,
  Telegram,
  TikTok,
  Trello,
  Tumblr,
  Twitch,
  Twitter,
  Vimeo,
  WhatsApp,
  YouTube,
};

/**
 * Searchable catalog used by the `Foundations / Brand Icons`
 * Storybook docs page. Order is alphabetical so the rendered grid
 * stays predictable; future phases (#309 follow-ups) append to
 * keep the registry stable for snapshot tests.
 */
export const brandCatalog: readonly BrandIconCatalogEntry[] = [
  { id: 'angellist', label: 'AngelList', Icon: AngelList },
  { id: 'apple', label: 'Apple', Icon: Apple },
  { id: 'asana', label: 'Asana', Icon: Asana },
  { id: 'atlassian', label: 'Atlassian', Icon: Atlassian },
  { id: 'bitbucket', label: 'Bitbucket', Icon: Bitbucket },
  { id: 'clubhouse', label: 'Clubhouse', Icon: Clubhouse },
  { id: 'discord', label: 'Discord', Icon: Discord },
  { id: 'dribbble', label: 'Dribbble', Icon: Dribbble },
  { id: 'dropbox', label: 'Dropbox', Icon: Dropbox },
  { id: 'facebook', label: 'Facebook', Icon: Facebook },
  { id: 'figma', label: 'Figma', Icon: Figma },
  { id: 'github', label: 'GitHub', Icon: Github },
  { id: 'gitlab', label: 'GitLab', Icon: Gitlab },
  { id: 'google', label: 'Google', Icon: Google },
  { id: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { id: 'medium', label: 'Medium', Icon: Medium },
  { id: 'microsoft', label: 'Microsoft', Icon: Microsoft },
  { id: 'notion', label: 'Notion', Icon: Notion },
  { id: 'pinterest', label: 'Pinterest', Icon: Pinterest },
  { id: 'reddit', label: 'Reddit', Icon: Reddit },
  { id: 'slack', label: 'Slack', Icon: Slack },
  { id: 'snapchat', label: 'Snapchat', Icon: Snapchat },
  { id: 'spotify', label: 'Spotify', Icon: Spotify },
  { id: 'stackoverflow', label: 'Stack Overflow', Icon: StackOverflow },
  { id: 'telegram', label: 'Telegram', Icon: Telegram },
  { id: 'tiktok', label: 'TikTok', Icon: TikTok },
  { id: 'trello', label: 'Trello', Icon: Trello },
  { id: 'tumblr', label: 'Tumblr', Icon: Tumblr },
  { id: 'twitch', label: 'Twitch', Icon: Twitch },
  { id: 'twitter', label: 'Twitter / X', Icon: Twitter },
  { id: 'vimeo', label: 'Vimeo', Icon: Vimeo },
  { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsApp },
  { id: 'youtube', label: 'YouTube', Icon: YouTube },
];
