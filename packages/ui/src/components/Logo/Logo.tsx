// Glaon Logo — brand identity primitive. Renders the wordmark or the
// standalone symbol. SVG paths are inlined here (sourced from
// `packages/assets/glaon{,_dark}.svg` and `symbol{,_dark}.svg`) so the
// wrap works in any consumer without a Vite SVG plugin or asset
// loader.
//
// Color strategy:
// - Body fill resolves through `currentColor`. The wrapper sets
//   `color` to `var(--brand-500)` on the light theme and
//   `var(--base-dirty)` on the dark theme — both Glaon design tokens
//   emitted by Style Dictionary into `dist/tokens/web.css`.
// - Accent fill is the brand-canonical orange (`var(--red-500)`),
//   theme-invariant — it stays the same on both surfaces.
//
// The `theme` prop is intentionally independent from the app-level
// `<ThemeProvider>`. Source tokens are single-mode today (#140
// follow-up adds Theme: Dark). `theme` here expresses contrast intent
// against the immediate surface, not the global app theme.

import type { CSSProperties, MouseEventHandler } from 'react';

export type LogoVariant = 'wordmark' | 'symbol';
export type LogoTheme = 'light' | 'dark';

export interface LogoProps {
  /**
   * Which mark to render. `wordmark` is the full Glaon logotype;
   * `symbol` is the standalone glyph (favicons, avatar fallbacks,
   * compact navigation chrome).
   * @default 'wordmark'
   */
  variant?: LogoVariant;
  /**
   * Contrast variant. `light` renders the brand-500 body (for light
   * surfaces); `dark` swaps to the off-white body (for dark or
   * brand-tinted surfaces). Independent from the app's
   * `<ThemeProvider>` — pick the value that contrasts with the
   * immediate background.
   * @default 'light'
   */
  theme?: LogoTheme;
  /**
   * Width of the rendered mark. Number is treated as `px`; string is
   * forwarded verbatim (`100%`, `4rem`, etc.). Height scales via the
   * SVG `viewBox` aspect ratio.
   */
  size?: number | string;
  /**
   * CSS background applied to the wrapper. Useful for previewing the
   * mark on a colored panel (story controls, brand-guideline tiles).
   * @default 'transparent'
   */
  background?: string;
  /**
   * Wrapper padding. Number → `px`; string → forwarded verbatim
   * (`8px`, `0.5rem`, `8px 12px`). Useful when the logo sits inside
   * a branded tile / chip and needs breathing room.
   */
  padding?: number | string;
  /**
   * Wrapper border-radius. Number → `px`; string → forwarded verbatim
   * (`8px`, `9999px` for a circle, `0.5rem`). Pair with `padding` and
   * `background` for badge- / chip-style logo presentations.
   */
  radius?: number | string;
  /**
   * Wrapper border. Pass any CSS `border` shorthand
   * (`1px solid var(--color-secondary-alt)`, `2px solid currentColor`).
   * Rendered as `style.border` on the wrapper.
   */
  border?: string;
  /**
   * Link destination. When set, the wrapper renders as an `<a>` so
   * the entire mark becomes a click target (typical "home" link in
   * a TopBar / SideNav). Mutually exclusive with `onPress`.
   */
  href?: string;
  /**
   * Click handler (`<button>` variant). Use when the logo opens a
   * menu / triggers a programmatic action rather than navigating.
   * Mutually exclusive with `href`.
   */
  onPress?: MouseEventHandler;
  /** Tailwind / className override hook for the wrapper. */
  className?: string;
  /**
   * Accessible label. Defaults to `'Glaon'`. Set `''` together with
   * `decorative` for purely ornamental usage.
   */
  label?: string;
  /**
   * Hide from assistive tech (sets `aria-hidden`). Use when the logo
   * is decorative — e.g. paired with a visible "Glaon" wordmark
   * elsewhere on the page. Ignored when `href` or `onPress` is set
   * (link / button always need an accessible name).
   * @default false
   */
  decorative?: boolean;
}

const bodyFill: Record<LogoTheme, string> = {
  light: 'var(--brand-500)',
  dark: 'var(--base-dirty)',
};

const accentFill = 'var(--red-500)';

function Wordmark() {
  return (
    <svg
      viewBox="0 0 530 239"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <path
        d="M493.705 71.344C513.756 71.344 530 88.6004 530 111.266V176.428H497.766V116.674C497.766 107.402 491.167 100.448 481.776 100.448C472.385 100.448 464.77 107.402 464.77 116.674V176.428H432.282V73.4044H464.77V86.0248C471.877 77.0103 482.029 71.344 493.705 71.344Z"
        fill="currentColor"
      />
      <path
        d="M363.039 178.489C329.028 178.489 306.439 155.823 306.439 124.916C306.439 94.0092 329.028 71.344 363.039 71.344C397.05 71.344 419.385 94.0092 419.385 124.916C419.385 155.823 397.05 178.489 363.039 178.489ZM363.039 149.384C376.745 149.127 387.151 138.825 387.151 124.916C387.151 111.008 376.745 100.706 363.039 100.448C349.079 100.706 338.927 111.008 338.927 124.916C338.927 138.825 349.079 149.127 363.039 149.384Z"
        fill="currentColor"
      />
      <path
        d="M300.276 149.642H304.845V176.428C302.56 177.458 299.515 178.489 296.215 178.489C282.509 178.489 271.341 171.535 264.996 160.975C256.874 171.792 244.945 178.489 230.224 178.489C202.051 178.489 179.969 154.793 179.969 124.916C179.969 95.0394 202.051 71.344 230.224 71.344C241.899 71.344 251.544 75.4649 259.158 82.419V73.4044H291.393V139.597C291.393 148.097 295.961 149.642 300.276 149.642ZM236.569 149.384C249.767 149.384 260.681 138.567 260.681 124.916C260.681 111.266 249.767 100.448 236.569 100.448C223.117 100.448 212.457 111.266 212.457 124.916C212.457 138.567 223.117 149.384 236.569 149.384Z"
        fill="currentColor"
      />
      <path d="M134.766 176.428V0H167.254V176.428H134.766Z" fill="currentColor" />
      <path
        d="M114.469 73.4044L114.723 177.458C114.723 215.577 92.6415 238.5 55.5849 238.5C28.9346 238.5 9.89869 226.395 1.52287 205.275L31.2189 193.17C35.0261 203.472 43.9095 209.911 55.5849 209.911C72.0827 209.911 82.489 198.321 82.489 179.261V165.611C74.1132 173.595 62.9455 178.489 50.2549 178.489C22.0817 178.489 0 154.793 0 124.916C0 94.7819 22.0817 71.344 50.2549 71.344C62.6917 71.344 73.6056 75.98 81.9814 83.7068V73.4044H114.469ZM58.3769 149.384C71.8289 149.384 82.7429 138.567 82.7429 124.916C82.7429 111.266 71.8289 100.448 58.3769 100.448C44.9248 100.448 34.2647 111.266 34.2647 124.916C34.2647 138.567 44.9248 149.384 58.3769 149.384Z"
        fill="currentColor"
      />
      <rect x="348" y="39" width="30" height="90" rx="5" style={{ fill: accentFill }} />
    </svg>
  );
}

function Symbol() {
  return (
    <svg
      viewBox="0 0 113 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <path
        d="M56.6002 139.489C22.5893 139.489 0 116.823 0 85.9163C0 55.0092 22.5893 32.344 56.6002 32.344C90.611 32.344 112.947 55.0092 112.947 85.9163C112.947 116.823 90.611 139.489 56.6002 139.489ZM56.6002 110.384C70.306 110.127 80.7123 99.8245 80.7123 85.9163C80.7123 72.0081 70.306 61.7057 56.6002 61.4482C42.6405 61.7057 32.488 72.0081 32.488 85.9163C32.488 99.8245 42.6405 110.127 56.6002 110.384Z"
        fill="currentColor"
      />
      <rect x="41.5612" y="0" width="30" height="90" rx="5" style={{ fill: accentFill }} />
    </svg>
  );
}

export function Logo({
  variant = 'wordmark',
  theme = 'light',
  size,
  background = 'transparent',
  padding,
  radius,
  border,
  href,
  onPress,
  className,
  label = 'Glaon',
  decorative = false,
}: LogoProps) {
  const wrapperStyle: CSSProperties = {
    display: 'inline-flex',
    color: bodyFill[theme],
    background,
    ...(size !== undefined ? { width: size } : {}),
    ...(padding !== undefined ? { padding } : {}),
    ...(radius !== undefined ? { borderRadius: radius } : {}),
    ...(border !== undefined ? { border } : {}),
  };

  const mark = variant === 'wordmark' ? <Wordmark /> : <Symbol />;

  // Link / button variants always carry an accessible name (the link
  // / button must be announced by screen readers regardless of
  // `decorative` — focusable controls without a name fail axe
  // `link-name` / `button-name`).
  if (href !== undefined) {
    return (
      <a
        href={href}
        aria-label={label}
        className={
          className ?? 'outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2'
        }
        style={wrapperStyle}
      >
        {mark}
      </a>
    );
  }

  if (onPress !== undefined) {
    return (
      <button
        type="button"
        onClick={onPress}
        aria-label={label}
        className={
          className ?? 'outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2'
        }
        style={wrapperStyle}
      >
        {mark}
      </button>
    );
  }

  // Presentational variant — `<span>` with role="img" or
  // aria-hidden depending on `decorative`.
  const a11yProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': label };

  return (
    <span className={className} style={wrapperStyle} {...a11yProps}>
      {mark}
    </span>
  );
}
