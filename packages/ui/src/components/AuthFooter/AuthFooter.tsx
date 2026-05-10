// Glaon AuthFooter — small `prompt + link` strip used at the bottom
// of the four auth flows (#469). Three contexts:
//
//   - login    → "Don't have an account? Sign up"
//   - signup   → "Already have an account? Log in"
//   - forgot   → "← Back to log in"
//
// Pure presentational primitive; the consumer wires the link via
// `linkHref` (or `onLinkClick` for SPA route handlers that want to
// preventDefault).

import type { MouseEventHandler, ReactNode } from 'react';

import { ArrowLeft } from '@untitledui/icons';

export interface AuthFooterProps {
  /**
   * Lead-in text rendered before the link, e.g. "Don't have an account?".
   * Omit for the back-link variant — pass only `linkText` and an
   * `iconLeading` set to `'arrow-left'`.
   */
  prompt?: string;
  /** Link label (the clickable part). */
  linkText: string;
  /** Destination URL for the link. */
  linkHref: string;
  /** Click handler — useful for SPA routers that want to preventDefault. */
  onLinkClick?: MouseEventHandler<HTMLAnchorElement>;
  /**
   * Optional leading icon rendered before the link text. `'arrow-left'`
   * is the convention for the "Back to log in" prompt.
   */
  iconLeading?: 'arrow-left';
  /** Optional override for the rendered prompt — passed straight as ReactNode. */
  promptNode?: ReactNode;
}

export function AuthFooter({
  prompt,
  promptNode,
  linkText,
  linkHref,
  onLinkClick,
  iconLeading,
}: AuthFooterProps) {
  const promptContent = promptNode ?? prompt;
  const linkProps: Record<string, unknown> = {
    href: linkHref,
    className:
      'inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-primary',
  };
  if (onLinkClick !== undefined) linkProps.onClick = onLinkClick;

  return (
    <p className="flex items-center justify-center gap-1 text-center text-sm text-tertiary">
      {promptContent !== undefined && <span className="text-tertiary">{promptContent}</span>}
      <a {...linkProps}>
        {iconLeading ? <ArrowLeft className="size-4" aria-hidden="true" /> : null}
        {linkText}
      </a>
    </p>
  );
}
