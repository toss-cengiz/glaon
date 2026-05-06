// Glaon app-icon registry — Phase D.1 rollout (#309 / #367).
// Inline SVG components for application logos shipped under
// `packages/ui/src/icons/app/`, paired with a typed `appCatalog`
// array that powers the Storybook catalog page (categorised + search).
//
// Sub-phase scoping for the rollout (see #367):
//   - Phase D.1.a (#399 ✓): Browsers (Chrome, Firefox, Safari, Edge,
//                            Opera, Brave) — six glyphs.
//   - Phase D.1.b (#401 ✓): Coding (VSCode, Sublime, IntelliJ,
//                            WebStorm, Vim) — five glyphs + Cursor
//                            cross-ref from the integration registry.
//   - Phase D.1.c (#402 ✓): Design (Sketch, Adobe XD, Photoshop,
//                            Illustrator) — four glyphs + Figma
//                            cross-ref from the brand registry.
//   - Phase D.1.d (#403 ✓): Messengers (Signal) — one new glyph +
//                            Discord / Slack / Telegram / WhatsApp
//                            cross-refs from the brand registry.
//   - Phase D.1.e (this)  : Music / Video / Productivity / OS /
//                            Social-networks / Other — fills the
//                            remaining catalog categories purely
//                            with cross-refs from the brand registry
//                            (no new SVGs). Closes the D.1 rollout.
//
// Each glyph component accepts the narrow `AppIconProps`
// (`className`, `aria-hidden`, `aria-label`); brand-spec multi-colour
// glyphs ship hard-coded fills, single-colour glyphs would inherit
// `currentColor`. Cross-referenced brand-registry glyphs use
// `BrandIconProps` (structurally identical to `AppIconProps`).

import { Brave } from './browsers/Brave';
import { Chrome } from './browsers/Chrome';
import { Edge } from './browsers/Edge';
import { Firefox } from './browsers/Firefox';
import { Opera } from './browsers/Opera';
import { Safari } from './browsers/Safari';

import { IntelliJ } from './coding/IntelliJ';
import { Sublime } from './coding/Sublime';
import { Vim } from './coding/Vim';
import { VsCode } from './coding/VsCode';
import { WebStorm } from './coding/WebStorm';

import { AdobeXd } from './design/AdobeXd';
import { Illustrator } from './design/Illustrator';
import { Photoshop } from './design/Photoshop';
import { Sketch } from './design/Sketch';

import { Signal } from './messengers/Signal';

// Cross-references from the brand / integration registries so
// consumers reach the same canonical glyph from either entry — same
// brand, one mark.
import { AngelList } from '../brand/AngelList';
import { Apple } from '../brand/Apple';
import { Asana } from '../brand/Asana';
import { Atlassian } from '../brand/Atlassian';
import { Bitbucket } from '../brand/Bitbucket';
import { Clubhouse } from '../brand/Clubhouse';
import { Discord } from '../brand/Discord';
import { Dribbble } from '../brand/Dribbble';
import { Dropbox } from '../brand/Dropbox';
import { Facebook } from '../brand/Facebook';
import { Figma } from '../brand/Figma';
import { Github } from '../brand/Github';
import { Gitlab } from '../brand/Gitlab';
import { Google } from '../brand/Google';
import { Linkedin } from '../brand/Linkedin';
import { Medium } from '../brand/Medium';
import { Microsoft } from '../brand/Microsoft';
import { Notion } from '../brand/Notion';
import { Pinterest } from '../brand/Pinterest';
import { Reddit } from '../brand/Reddit';
import { Slack } from '../brand/Slack';
import { Snapchat } from '../brand/Snapchat';
import { Spotify } from '../brand/Spotify';
import { StackOverflow } from '../brand/StackOverflow';
import { Telegram } from '../brand/Telegram';
import { TikTok } from '../brand/TikTok';
import { Trello } from '../brand/Trello';
import { Tumblr } from '../brand/Tumblr';
import { Twitch } from '../brand/Twitch';
import { Twitter } from '../brand/Twitter';
import { Vimeo } from '../brand/Vimeo';
import { WhatsApp } from '../brand/WhatsApp';
import { YouTube } from '../brand/YouTube';
import { Cursor } from '../integration/Cursor';

import type { AppIconCatalogEntry } from './types';

export type { AppIconCatalogEntry, AppIconCategory, AppIconProps } from './types';
export { Brave, Chrome, Edge, Firefox, Opera, Safari };
export { IntelliJ, Sublime, Vim, VsCode, WebStorm };
export { AdobeXd, Illustrator, Photoshop, Sketch };
export { Signal };

/**
 * `appCatalog` — typed registry consumed by the Storybook catalog.
 * Sorted alphabetically by `label` within each category so the grid
 * renders in a stable order without per-render sorting.
 */
export const appCatalog: AppIconCatalogEntry[] = [
  // Browsers
  { id: 'brave', label: 'Brave', category: 'browsers', Icon: Brave },
  { id: 'chrome', label: 'Chrome', category: 'browsers', Icon: Chrome },
  { id: 'edge', label: 'Microsoft Edge', category: 'browsers', Icon: Edge },
  { id: 'firefox', label: 'Firefox', category: 'browsers', Icon: Firefox },
  { id: 'opera', label: 'Opera', category: 'browsers', Icon: Opera },
  { id: 'safari', label: 'Safari', category: 'browsers', Icon: Safari },
  // Coding
  { id: 'bitbucket', label: 'Bitbucket', category: 'coding', Icon: Bitbucket },
  { id: 'cursor', label: 'Cursor', category: 'coding', Icon: Cursor },
  { id: 'github', label: 'GitHub', category: 'coding', Icon: Github },
  { id: 'gitlab', label: 'GitLab', category: 'coding', Icon: Gitlab },
  { id: 'intellij', label: 'IntelliJ IDEA', category: 'coding', Icon: IntelliJ },
  { id: 'stackoverflow', label: 'Stack Overflow', category: 'coding', Icon: StackOverflow },
  { id: 'sublime', label: 'Sublime Text', category: 'coding', Icon: Sublime },
  { id: 'vim', label: 'Vim', category: 'coding', Icon: Vim },
  { id: 'vscode', label: 'Visual Studio Code', category: 'coding', Icon: VsCode },
  { id: 'webstorm', label: 'WebStorm', category: 'coding', Icon: WebStorm },
  // Design
  { id: 'adobe-xd', label: 'Adobe XD', category: 'design', Icon: AdobeXd },
  { id: 'figma', label: 'Figma', category: 'design', Icon: Figma },
  { id: 'illustrator', label: 'Illustrator', category: 'design', Icon: Illustrator },
  { id: 'photoshop', label: 'Photoshop', category: 'design', Icon: Photoshop },
  { id: 'sketch', label: 'Sketch', category: 'design', Icon: Sketch },
  // Messengers
  { id: 'discord', label: 'Discord', category: 'messengers', Icon: Discord },
  { id: 'signal', label: 'Signal', category: 'messengers', Icon: Signal },
  { id: 'slack', label: 'Slack', category: 'messengers', Icon: Slack },
  { id: 'telegram', label: 'Telegram', category: 'messengers', Icon: Telegram },
  { id: 'whatsapp', label: 'WhatsApp', category: 'messengers', Icon: WhatsApp },
  // Music
  { id: 'spotify', label: 'Spotify', category: 'music', Icon: Spotify },
  // Video
  { id: 'twitch', label: 'Twitch', category: 'video', Icon: Twitch },
  { id: 'vimeo', label: 'Vimeo', category: 'video', Icon: Vimeo },
  { id: 'youtube', label: 'YouTube', category: 'video', Icon: YouTube },
  // OS
  { id: 'apple', label: 'Apple', category: 'os', Icon: Apple },
  { id: 'microsoft', label: 'Microsoft', category: 'os', Icon: Microsoft },
  // Productivity
  { id: 'asana', label: 'Asana', category: 'productivity', Icon: Asana },
  { id: 'atlassian', label: 'Atlassian', category: 'productivity', Icon: Atlassian },
  { id: 'dropbox', label: 'Dropbox', category: 'productivity', Icon: Dropbox },
  { id: 'notion', label: 'Notion', category: 'productivity', Icon: Notion },
  { id: 'trello', label: 'Trello', category: 'productivity', Icon: Trello },
  // Social networks
  { id: 'angellist', label: 'AngelList', category: 'social-networks', Icon: AngelList },
  { id: 'clubhouse', label: 'Clubhouse', category: 'social-networks', Icon: Clubhouse },
  { id: 'dribbble', label: 'Dribbble', category: 'social-networks', Icon: Dribbble },
  { id: 'facebook', label: 'Facebook', category: 'social-networks', Icon: Facebook },
  { id: 'google', label: 'Google', category: 'social-networks', Icon: Google },
  { id: 'linkedin', label: 'LinkedIn', category: 'social-networks', Icon: Linkedin },
  { id: 'medium', label: 'Medium', category: 'social-networks', Icon: Medium },
  { id: 'pinterest', label: 'Pinterest', category: 'social-networks', Icon: Pinterest },
  { id: 'reddit', label: 'Reddit', category: 'social-networks', Icon: Reddit },
  { id: 'snapchat', label: 'Snapchat', category: 'social-networks', Icon: Snapchat },
  { id: 'tiktok', label: 'TikTok', category: 'social-networks', Icon: TikTok },
  { id: 'tumblr', label: 'Tumblr', category: 'social-networks', Icon: Tumblr },
  { id: 'twitter', label: 'Twitter', category: 'social-networks', Icon: Twitter },
];
