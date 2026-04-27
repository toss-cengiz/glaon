// Glaon Stat — single-metric KPI card. Per CLAUDE.md's UUI Source Rule,
// the typography + colour patterns are anchored on the Untitled UI kit
// `metrics-card-gray-light` source under
// `packages/ui/src/components/marketing/metrics/metrics-card-gray-light.tsx`.
// That kit file ships a hard-coded marketing section (3 metrics in a
// `<dl>`); the Glaon `Stat` wrap parameterizes a single metric and adds
// optional `delta` (up / down / neutral) and `prefix` slots that are
// idiomatic for dashboard KPIs but not present in the kit template.
// Tokens flow through Tailwind v4 `@theme` (UUI `theme.css`) and
// Glaon's brand override layer.

import type { FC, ReactNode } from 'react';

import { ArrowDown, ArrowUp } from '@untitledui/icons';

// `@untitledui/icons` declares each icon's `Props` interface in a
// per-file module that isn't re-exported, so deriving an exact type
// against the raw imports trips TS4023 — same workaround as the icon
// picker in `icons/storybook.ts`.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type IconComponent = FC<any>;

export type StatSize = 'sm' | 'md' | 'lg';
export type StatDeltaDirection = 'up' | 'down' | 'neutral';

export interface StatDelta {
  /** Formatted change figure, e.g. "+12.5%" or "-3.2k". */
  value: ReactNode;
  /** Direction of the change; drives icon + colour. */
  direction: StatDeltaDirection;
}

export interface StatProps {
  /** Caption rendered under the value, e.g. "Total revenue". */
  label: ReactNode;
  /** Headline metric, e.g. "$32,400". */
  value: ReactNode;
  /** Optional change indicator rendered next to the value. */
  delta?: StatDelta;
  /**
   * Optional leading slot rendered in front of the value — typically a
   * currency icon or unit indicator. Accepts any ReactNode so consumers
   * can pass an icon component instance, an SVG, or a span.
   */
  prefix?: ReactNode;
  /** Visual scale; defaults to `md`. */
  size?: StatSize;
  /** Override the kit's outer container className. */
  className?: string;
}

const sizes: Record<StatSize, { value: string; label: string; delta: string; deltaIcon: string }> =
  {
    sm: {
      value: 'text-display-xs font-semibold',
      label: 'text-sm text-tertiary',
      delta: 'text-xs font-medium',
      deltaIcon: 'size-3',
    },
    md: {
      value: 'text-display-md font-semibold',
      label: 'text-base text-tertiary',
      delta: 'text-sm font-medium',
      deltaIcon: 'size-4',
    },
    lg: {
      value: 'text-display-xl font-semibold',
      label: 'text-lg text-tertiary',
      delta: 'text-sm font-medium',
      deltaIcon: 'size-4',
    },
  };

// Use the `*-700` palette steps rather than `text-fg-*-primary` semantic
// tokens — at small sizes (`text-xs` / `text-sm`) the `*-primary` family
// in UUI's default palette doesn't pass WCAG AA contrast on the page
// background. The `*-700` step is 4.5:1+ on the same surface, which is
// what axe's `color-contrast` rule wants.
const deltaColor: Record<StatDeltaDirection, string> = {
  up: 'text-success-700',
  down: 'text-error-700',
  neutral: 'text-secondary',
};

const deltaIcons: Record<StatDeltaDirection, IconComponent | null> = {
  up: ArrowUp,
  down: ArrowDown,
  neutral: null,
};

export function Stat({ label, value, delta, prefix, size = 'md', className }: StatProps) {
  const sz = sizes[size];

  // axe `definition-list` requires `<dt>` to precede `<dd>` in source
  // order. We want the value (the `<dd>`) rendered ABOVE the label (the
  // `<dt>`) visually, so we wrap the pair in a `<div>` with
  // `flex-col-reverse` — same pattern as the kit's
  // `metrics-card-gray-light` template. Direct `<div>` children of
  // `<dl>` are explicitly allowed by HTML5 + axe.
  const containerClass = 'flex flex-col-reverse gap-1';
  const DeltaIcon = delta ? deltaIcons[delta.direction] : null;

  return (
    <dl className={className}>
      <div className={containerClass}>
        <dt className={sz.label}>{label}</dt>
        <dd className={`flex items-center gap-2 text-primary ${sz.value}`}>
          {prefix !== undefined ? (
            <span className="flex items-center text-fg-quaternary">{prefix}</span>
          ) : null}
          <span>{value}</span>
          {delta ? (
            <span
              className={`ml-1 inline-flex items-center gap-0.5 ${sz.delta} ${deltaColor[delta.direction]}`}
            >
              {DeltaIcon ? <DeltaIcon aria-hidden="true" className={sz.deltaIcon} /> : null}
              {delta.value}
            </span>
          ) : null}
        </dd>
      </div>
    </dl>
  );
}
