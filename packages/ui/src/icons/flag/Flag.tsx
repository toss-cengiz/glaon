// Glaon Flag — country-flag icon backed by the `flag-icons` npm
// package (option B from the architectural decision in #366). The
// package ships a CSS sprite plus per-country SVG assets resolved
// from same-origin URLs via Vite's bundler, so the strict CSP
// (`default-src 'self'`) stays intact — no third-party CDN host to
// whitelist.
//
// The CSS is imported once at the package entry (see
// `src/styles/index.css`); consumers don't have to set anything up.
//
// Usage:
//
//   <Flag country="TR" shape="circle" aria-label="Türkiye" />
//   <Flag country="us" />                 // rectangle, decorative
//   <Flag country="GB" shape="square" />  // square aspect

import type { FlagIconProps } from './types';

export function Flag({
  country,
  shape = 'rectangle',
  className,
  'aria-label': ariaLabel,
}: FlagIconProps) {
  // `flag-icons` expects lowercase ISO codes in the class name.
  const code = country.toLowerCase();

  // The package's own classes:
  //   `fi`               — required base; sets background-image + 4:3 ratio.
  //   `fis`              — opt-in 1:1 square aspect (full-bleed flag).
  //   `fi-{code}`        — country selector.
  //
  // For circle, we wrap the underlying square sprite in a
  // `rounded-full overflow-hidden` container so the bitmap clips to a
  // circle. Using `inline-flex` keeps the flag inline with surrounding
  // text without triggering layout shifts.
  const baseClasses = ['fi', `fi-${code}`];
  if (shape === 'square' || shape === 'circle') baseClasses.push('fis');

  const isDecorative = ariaLabel === undefined;
  const ariaProps = isDecorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': ariaLabel };

  // The `block` flag span itself sizes via the wrapper; setting `w-full
  // h-full` makes the sprite fill the parent box. `display: inline-block`
  // is required for the background-image rendering — the kit CSS sets
  // `display: inline-block` as part of `.fi`, so we don't add it here.
  if (shape === 'circle') {
    return (
      <span
        {...ariaProps}
        className={
          'inline-block size-5 overflow-hidden rounded-full' + (className ? ' ' + className : '')
        }
      >
        <span className={baseClasses.join(' ')} style={{ display: 'block', height: '100%' }} />
      </span>
    );
  }

  // Rectangle / square — the flag-icons span carries the aspect ratio
  // (4:3 for `.fi`, 1:1 with `.fis`). Glaon's default size token
  // (`size-5` = 1.25rem) drives both axes; consumers can override via
  // `className`.
  const sizingClasses =
    shape === 'square'
      ? 'inline-block size-5'
      : // Rectangle preserves 4:3 aspect ratio at the size-5 height.
        'inline-block h-5 w-[1.6667rem]';

  return (
    <span
      {...ariaProps}
      className={sizingClasses + ' ' + baseClasses.join(' ') + (className ? ' ' + className : '')}
    />
  );
}
