// Glaon app-icon registry — Phase D.1 rollout (#309 / #367).
// Inline SVG components for application logos shipped under
// `packages/ui/src/icons/app/`, paired with a typed `appCatalog`
// array that powers the Storybook catalog page (categorised + search).
//
// Sub-phase scoping for the rollout (see #367):
//   - Phase D.1.a (#399 ✓): Browsers (Chrome, Firefox, Safari, Edge,
//                            Opera, Brave) — six glyphs.
//   - Phase D.1.b (this)  : Coding (VSCode, Sublime, IntelliJ,
//                            WebStorm, Vim) — five glyphs. `Cursor`
//                            already lives in the integration
//                            registry (`Foundations / Integration
//                            Icons`) — pull it from there to avoid
//                            cross-registry duplication.
//   - Phase D.1.c (todo)  : Design (Figma, Sketch, Adobe XD, …)
//   - Phase D.1.d (todo)  : Messengers (Slack, Discord, Telegram, …)
//   - Phase D.1.e (todo)  : Music / Video / Productivity / OS / Other
//
// Each glyph component accepts the narrow `AppIconProps`
// (`className`, `aria-hidden`, `aria-label`); brand-spec multi-colour
// glyphs ship hard-coded fills, single-colour glyphs would inherit
// `currentColor` (none yet — every browser / coding logo is
// multi-colour by definition).

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

// Re-exported from the integration registry so consumers reach the
// same canonical glyph from either entry — the editor and the AI
// integration share one brand mark.
import { Cursor } from '../integration/Cursor';

import type { AppIconCatalogEntry } from './types';

export type { AppIconCatalogEntry, AppIconCategory, AppIconProps } from './types';
export { Brave, Chrome, Edge, Firefox, Opera, Safari };
export { IntelliJ, Sublime, Vim, VsCode, WebStorm };

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
  { id: 'cursor', label: 'Cursor', category: 'coding', Icon: Cursor },
  { id: 'intellij', label: 'IntelliJ IDEA', category: 'coding', Icon: IntelliJ },
  { id: 'sublime', label: 'Sublime Text', category: 'coding', Icon: Sublime },
  { id: 'vim', label: 'Vim', category: 'coding', Icon: Vim },
  { id: 'vscode', label: 'Visual Studio Code', category: 'coding', Icon: VsCode },
  { id: 'webstorm', label: 'WebStorm', category: 'coding', Icon: WebStorm },
];
