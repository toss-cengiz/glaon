// Shared types for Table cell-type sub-components (Phase A of #323).
// Each cell-type accepts a `size` echoing Figma's `Size` axis (sm /
// md) and a `className` override hook. Most cell-types compose
// existing Glaon primitives (`<Avatar>`, `<Badge>`, `<ProgressBar>`,
// `<Select>`, etc.) so the wrap layer stays thin.

import type { FC } from 'react';

export type CellSize = 'sm' | 'md';

export interface CellBaseProps {
  /** Visual scale. Mirrors Figma's `Size` axis. @default 'md' */
  size?: CellSize;
  /** Tailwind override hook. */
  className?: string;
}

// `@untitledui/icons` declares per-file icon types; type the slot
// loosely (function component accepting `className`) so this matches
// both the kit's `IconComponent` and the icon picker map.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
export type IconComponent = FC<any>;

export function joinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}
