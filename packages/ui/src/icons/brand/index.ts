// Glaon brand-icon registry — phase A of the icon registry rollout
// (see #309). Inline SVG components for every platform glyph that
// ships with `@glaon/ui`, paired with a typed `brandCatalog` array
// that powers the Storybook catalog page.
//
// Phase A scope (this file): six glyphs the existing `<SocialButton>`
// primitive consumes — Apple, Dribbble, Facebook, Figma, Google,
// Twitter. Phase A.2 follow-up adds the remaining 28 platforms
// listed under Figma's "Social icon" frame
// (https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1025-31781).
//
// Each glyph component accepts the narrow `BrandIconProps`
// (`className`, `aria-hidden`, `aria-label`) so parent buttons /
// links control sizing + accessibility. Single-colour glyphs inherit
// `currentColor`; multi-colour glyphs (Figma, Google) ship fixed
// brand fills per the platform's brand spec.

import { Apple } from './Apple';
import { Dribbble } from './Dribbble';
import { Facebook } from './Facebook';
import { Figma } from './Figma';
import { Google } from './Google';
import { Twitter } from './Twitter';
import type { BrandIconCatalogEntry } from './types';

export type { BrandIconCatalogEntry, BrandIconProps } from './types';
export { Apple, Dribbble, Facebook, Figma, Google, Twitter };

/**
 * Searchable catalog used by the `Foundations / Brand Icons`
 * Storybook docs page. Order is alphabetical so the rendered grid
 * stays predictable; future phases (#309 follow-ups) append to
 * keep the registry stable for snapshot tests.
 */
export const brandCatalog: readonly BrandIconCatalogEntry[] = [
  { id: 'apple', label: 'Apple', Icon: Apple },
  { id: 'dribbble', label: 'Dribbble', Icon: Dribbble },
  { id: 'facebook', label: 'Facebook', Icon: Facebook },
  { id: 'figma', label: 'Figma', Icon: Figma },
  { id: 'google', label: 'Google', Icon: Google },
  { id: 'twitter', label: 'Twitter / X', Icon: Twitter },
];
