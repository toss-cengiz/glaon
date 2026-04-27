// Curated icon picker for Storybook controls.
//
// Untitled UI's `@untitledui/icons` package ships ~1,179 React icons.
// Surfacing all of them as a Storybook `select` control would be useless
// noise; the map below is a small, opinionated subset that covers the
// 80 % of cases primitive PRs will need (button leading/trailing icons,
// alert affordances, input adornments). Stories opt into the full set by
// importing directly from `@untitledui/icons`.
//
// Usage in a story:
//
//   import { storybookIcons } from '@/icons/storybook';
//   ...
//   argTypes: {
//     iconLeading: { control: 'select', options: Object.keys(storybookIcons), mapping: storybookIcons },
//   }
//
// Adding a new entry: pick a token-aware name from `@untitledui/icons`,
// import it here, and append it under a sensible group (don't bloat).

import type { FC } from 'react';

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell01,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy01,
  Download01,
  Edit01,
  Eye,
  FilterFunnel01,
  Heart,
  Link01,
  Mail01,
  Plus,
  SearchSm,
  Settings01,
  Star01,
  Trash01,
  Upload01,
  User01,
  X,
} from '@untitledui/icons';

// `@untitledui/icons` declares each icon's `Props` interface in a per-file
// module that isn't re-exported, so deriving `typeof storybookIcons`
// against the raw imports trips TS4023.
//
// The map needs to be assignment-compatible with two different
// `iconLeading` prop shapes:
//   - the kit Button (`FC<{ className?: string }>`) — narrow
//   - PressableButton (`ComponentType<SVGProps + { color?, size? }>`) — wide
//
// Function parameter types are contravariant, so no single non-`any`
// component shape satisfies both at the same time. `ComponentType<any>`
// keeps the Storybook `mapping` consumable by both wraps without forcing
// callers to cast at every story site.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type IconComponent = FC<any>;

export const storybookIcons: Record<string, IconComponent | undefined> = {
  none: undefined,
  // Movement / chevrons
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  // Universal actions
  plus: Plus,
  check: Check,
  x: X,
  edit: Edit01,
  trash: Trash01,
  copy: Copy01,
  link: Link01,
  search: SearchSm,
  filter: FilterFunnel01,
  download: Download01,
  upload: Upload01,
  // Surface affordances
  mail: Mail01,
  bell: Bell01,
  user: User01,
  settings: Settings01,
  eye: Eye,
  heart: Heart,
  star: Star01,
};
