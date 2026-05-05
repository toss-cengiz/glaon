// Glaon integration-icon registry — Phase D.3 of the icon registry
// rollout (#309 / #369). Inline SVG components for the 16
// integration / AI-platform glyphs from Figma's Specialized icon
// collections frame, paired with a typed `integrationCatalog`
// array that powers the Storybook catalog page.
//
// Likely consumer: Glaon's Settings → "Integrations" page (Phase 2).
// Each integration row in a `<Table>` shows the integration icon
// next to its display name; D.3 unblocks that work.
//
// Each glyph component accepts the narrow `IntegrationIconProps`
// (`className`, `aria-hidden` default true, `aria-label`). All
// glyphs are single-colour and inherit `currentColor` so consumers
// pick the right tint per surface.
//
// Cross-references: Figma, GitHub, and Notion are re-exported from
// the brand registry rather than duplicated — the integration mark
// matches the brand mark, so `<Figma>` from `icons/brand/` is the
// canonical artwork. OpenAI is distinct from ChatGPT (parent vs
// product) and ships standalone here.

import { Figma, Github, Notion } from '../brand';
import { Bolt } from './Bolt';
import { ChatGPT } from './ChatGPT';
import { Claude } from './Claude';
import { Cursor } from './Cursor';
import { Gemini } from './Gemini';
import { Grok } from './Grok';
import { Lovable } from './Lovable';
import { N8n } from './N8n';
import { OpenAI } from './OpenAI';
import { Perplexity } from './Perplexity';
import { Replit } from './Replit';
import { Vercel } from './Vercel';
import { Webflow } from './Webflow';
import type { IntegrationIconCatalogEntry } from './types';

export type { IntegrationIconCatalogEntry, IntegrationIconProps } from './types';
export {
  Bolt,
  ChatGPT,
  Claude,
  Cursor,
  Gemini,
  Grok,
  Lovable,
  N8n,
  OpenAI,
  Perplexity,
  Replit,
  Vercel,
  Webflow,
};

/**
 * Searchable catalog used by the `Foundations / Integration Icons`
 * Storybook docs page. Order is alphabetical so the rendered grid
 * stays predictable for snapshot tests. Cross-referenced glyphs
 * (Figma, GitHub, Notion) appear in the catalog with the same
 * components used in the brand registry, so consumers see a single
 * canonical mark per platform regardless of which registry they
 * import from.
 */
export const integrationCatalog: readonly IntegrationIconCatalogEntry[] = [
  { id: 'bolt', label: 'Bolt', Icon: Bolt },
  { id: 'chatgpt', label: 'ChatGPT', Icon: ChatGPT },
  { id: 'claude', label: 'Claude', Icon: Claude },
  { id: 'cursor', label: 'Cursor', Icon: Cursor },
  { id: 'figma', label: 'Figma', Icon: Figma },
  { id: 'gemini', label: 'Gemini', Icon: Gemini },
  { id: 'github', label: 'GitHub', Icon: Github },
  { id: 'grok', label: 'Grok', Icon: Grok },
  { id: 'lovable', label: 'Lovable', Icon: Lovable },
  { id: 'n8n', label: 'n8n', Icon: N8n },
  { id: 'notion', label: 'Notion', Icon: Notion },
  { id: 'openai', label: 'OpenAI', Icon: OpenAI },
  { id: 'perplexity', label: 'Perplexity', Icon: Perplexity },
  { id: 'replit', label: 'Replit', Icon: Replit },
  { id: 'vercel', label: 'Vercel', Icon: Vercel },
  { id: 'webflow', label: 'Webflow', Icon: Webflow },
];
