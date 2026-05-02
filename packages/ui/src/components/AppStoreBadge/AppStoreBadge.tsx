// Glaon AppStoreBadge — official app-store download badge. UUI's kit
// doesn't ship app-store badges and the official Apple / Google /
// Samsung / Huawei badges are trademark assets governed by each
// platform's brand guidelines. Per the UUI Source Rule's "no kit
// source" exception, Glaon hand-rolls a stylised badge using the
// kit's surface vocabulary (rounded-lg + ring) plus inline SVG
// brand glyphs.
//
// Maps Figma's `web-primitives-app-store-badge` axes 1:1:
//   - `Store`:           app-store / mac-app-store / google-play /
//                        galaxy-store / app-gallery (5 platforms)
//   - `Dark background`: false (badge for light page bg → dark badge) /
//                        true  (badge for dark page bg → light badge)
//
// Note: in production-grade marketing pages, swap these stylised
// badges for the official trademark assets downloaded from each
// platform's brand kit. This primitive is sized for design-system
// consistency, not marketing pixel-fidelity.

import type { MouseEventHandler, ReactNode } from 'react';

export type AppStore =
  | 'app-store'
  | 'mac-app-store'
  | 'google-play'
  | 'galaxy-store'
  | 'app-gallery';

/**
 * `light` (default) renders a dark badge for use on a light page
 * background; `dark` renders a light badge for use on a dark page
 * background. Mirrors Figma's `Dark background` axis (inverted
 * naming so the prop reads as the badge's own colour, not the page's).
 */
export type AppStoreBadgeTheme = 'light' | 'dark';

export interface AppStoreBadgeProps {
  /** Which store this badge links to. */
  store: AppStore;
  /**
   * Badge surface tone. `dark` (default) = black badge for light
   * pages; `light` = white badge for dark pages.
   * @default 'dark'
   */
  theme?: AppStoreBadgeTheme | undefined;
  /**
   * Link destination. When set, renders an `<a>`. When omitted (and
   * `onPress` is also omitted), renders a presentational `<span>`
   * — useful for read-only catalogues.
   */
  href?: string | undefined;
  /** Click handler for `<button>` variant. Mutually exclusive with `href`. */
  onPress?: MouseEventHandler<HTMLButtonElement> | undefined;
  /** Tailwind override hook. */
  className?: string | undefined;
}

interface StoreTokens {
  topLine: string;
  bottomLine: string;
  glyph: ReactNode;
}

// Inline brand SVG glyphs — minimal viewBox 0 0 24 24 paths so they
// inherit `currentColor` from the surrounding badge text colour.
const storeTokens: Record<AppStore, StoreTokens> = {
  'app-store': {
    topLine: 'Download on the',
    bottomLine: 'App Store',
    glyph: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.535 12.625c.024-2.612 2.13-3.873 2.226-3.93-1.213-1.77-3.099-2.013-3.766-2.038-1.601-.162-3.124.943-3.937.943-.812 0-2.062-.92-3.388-.895-1.745.025-3.354 1.013-4.252 2.572-1.812 3.143-.464 7.793 1.301 10.34.86 1.247 1.886 2.652 3.232 2.602 1.296-.052 1.787-.84 3.354-.84 1.567 0 2.011.84 3.39.812 1.396-.025 2.282-1.275 3.137-2.526.985-1.451 1.392-2.85 1.417-2.924-.031-.014-2.722-1.046-2.748-4.116Zm-2.594-7.55c.715-.866 1.197-2.069 1.066-3.27-1.029.041-2.275.685-3.013 1.55-.661.766-1.241 1.989-1.084 3.166 1.151.089 2.315-.585 3.031-1.446Z" />
      </svg>
    ),
  },
  'mac-app-store': {
    topLine: 'Download on the',
    bottomLine: 'Mac App Store',
    glyph: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.535 12.625c.024-2.612 2.13-3.873 2.226-3.93-1.213-1.77-3.099-2.013-3.766-2.038-1.601-.162-3.124.943-3.937.943-.812 0-2.062-.92-3.388-.895-1.745.025-3.354 1.013-4.252 2.572-1.812 3.143-.464 7.793 1.301 10.34.86 1.247 1.886 2.652 3.232 2.602 1.296-.052 1.787-.84 3.354-.84 1.567 0 2.011.84 3.39.812 1.396-.025 2.282-1.275 3.137-2.526.985-1.451 1.392-2.85 1.417-2.924-.031-.014-2.722-1.046-2.748-4.116Zm-2.594-7.55c.715-.866 1.197-2.069 1.066-3.27-1.029.041-2.275.685-3.013 1.55-.661.766-1.241 1.989-1.084 3.166 1.151.089 2.315-.585 3.031-1.446Z" />
      </svg>
    ),
  },
  'google-play': {
    topLine: 'GET IT ON',
    bottomLine: 'Google Play',
    glyph: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3.609 1.814 13.792 12 3.61 22.186a1.93 1.93 0 0 1-.609-1.42V3.234a1.93 1.93 0 0 1 .608-1.42Z"
          fill="#00C3FF"
        />
        <path
          d="m16.81 8.99 2.834 1.622c1.027.587 1.027 2.07 0 2.657L16.811 14.89 13.792 12l3.018-3.01Z"
          fill="#FFCB00"
        />
        <path
          d="m13.792 12 3.018 2.991-12.34 7.054a1.92 1.92 0 0 1-.86.157L13.79 12Z"
          fill="#E63845"
        />
        <path
          d="m4.469 1.798 12.341 7.193L13.793 12 3.61 1.815a1.92 1.92 0 0 1 .859-.017Z"
          fill="#01A350"
        />
      </svg>
    ),
  },
  'galaxy-store': {
    topLine: 'Get it on',
    bottomLine: 'Galaxy Store',
    glyph: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.31 14.473 9.516 22 9.546l-6.094 4.45L18.281 21.219 12 16.844l-6.281 4.375 2.375-7.223L2 9.546l7.527-.03L12 2.311Z" />
      </svg>
    ),
  },
  'app-gallery': {
    topLine: 'EXPLORE IT ON',
    bottomLine: 'AppGallery',
    glyph: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2c.83 0 1.625.166 2.351.466a4.51 4.51 0 0 0 .156 4.494c.762 1.279 2.061 2.105 3.49 2.31A8.005 8.005 0 0 1 12 22 8 8 0 0 1 4 14c0-1.466.394-2.84 1.082-4.022 1.485-.013 2.85-.78 3.654-2.066a4.484 4.484 0 0 0 .197-4.452A7.97 7.97 0 0 1 12 2Z" />
      </svg>
    ),
  },
};

const themeClasses: Record<AppStoreBadgeTheme, string> = {
  dark: 'bg-utility-neutral-900 text-white ring-1 ring-inset ring-utility-neutral-900 hover:bg-utility-neutral-800',
  light:
    'bg-white text-utility-neutral-900 ring-1 ring-inset ring-utility-neutral-900 hover:bg-utility-neutral-50',
};

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

const baseClass =
  'inline-flex h-12 items-center gap-2 rounded-lg px-3 outline-focus-ring transition focus-visible:outline-2 focus-visible:outline-offset-2';

/**
 * Glaon AppStoreBadge — stylised app-store download badge. Renders
 * as an `<a>` (when `href`) or `<button>` (when `onPress`) or
 * presentational `<span>` (when neither is set, e.g. catalogue
 * preview).
 */
export function AppStoreBadge({
  store,
  theme = 'dark',
  href,
  onPress,
  className,
}: AppStoreBadgeProps) {
  const tokens = storeTokens[store];
  const rootClass = joinClasses(baseClass, themeClasses[theme], className);
  const accessibleLabel = `${tokens.topLine} ${tokens.bottomLine}`;

  const inner = (
    <>
      <span className="size-7 shrink-0">{tokens.glyph}</span>
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
          {tokens.topLine}
        </span>
        <span className="text-base font-semibold">{tokens.bottomLine}</span>
      </span>
    </>
  );

  if (href !== undefined) {
    return (
      <a href={href} aria-label={accessibleLabel} className={rootClass}>
        {inner}
      </a>
    );
  }

  if (onPress !== undefined) {
    return (
      <button type="button" onClick={onPress} aria-label={accessibleLabel} className={rootClass}>
        {inner}
      </button>
    );
  }

  return (
    <span aria-label={accessibleLabel} className={rootClass}>
      {inner}
    </span>
  );
}
