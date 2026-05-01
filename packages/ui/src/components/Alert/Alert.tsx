// Glaon Alert — parametric wrap over the kit's `AlertFloating` +
// `AlertFullWidth` primitives under `application/alerts/alerts.tsx`.
//
// Per CLAUDE.md's UUI Source Rule, the structural HTML/CSS, the
// FeaturedIcon + Button + CloseButton composition, and the 6-color
// + 2-size variant matrix come from the kit; Glaon's contribution
// is the wrap layer (token override via `theme.css` +
// `glaon-overrides.css`, prop API consistency, Figma `parameters.design`
// mapping in the story).
//
// Maps Figma's `web-primitives-alert` axes 1:1:
//   - `Color`: default / brand / gray / error / warning / success
//   - `Size`:  floating / full-width
//
// Usage:
//
//   <Alert
//     color="success"
//     size="floating"
//     title="Settings saved"
//     description="Your changes are live across the workspace."
//     confirmLabel="View changes"
//     onConfirm={() => navigate('/changes')}
//     onDismiss={() => setOpen(false)}
//   />
//
// `size === 'full-width'` exposes an `actionType` knob (`button` |
// `link`) — the kit renders confirm / dismiss as filled vs. inline
// links accordingly.

import type { ReactNode } from 'react';

import { AlertFloating, AlertFullWidth } from '../application/alerts/alerts';

export type AlertColor = 'default' | 'brand' | 'gray' | 'error' | 'warning' | 'success';
export type AlertSize = 'floating' | 'full-width';
export type AlertActionType = 'button' | 'link';

export interface AlertProps {
  /** Bold first line of the alert. */
  title: string;
  /** Optional secondary line; rendered after the title. */
  description?: ReactNode;
  /**
   * Severity / surface palette. Mirrors Figma's `Color` axis 1:1.
   * @default 'default'
   */
  color?: AlertColor | undefined;
  /**
   * Layout variant. `floating` is a card-style alert (modal-friendly,
   * dashboard surface); `full-width` is an inline page-wide bar
   * (system-status pinned to a page top).
   * @default 'floating'
   */
  size?: AlertSize | undefined;
  /**
   * Action button styling for `size='full-width'` only. `button`
   * renders filled / secondary buttons, `link` renders inline link
   * styling. Ignored when `size='floating'` (kit always uses link
   * styling there).
   * @default 'button'
   */
  actionType?: AlertActionType | undefined;
  /** Label for the primary CTA (right side). */
  confirmLabel?: string | undefined;
  /** Click handler for the primary CTA. */
  onConfirm?: (() => void) | undefined;
  /**
   * Label for the dismiss button (also serves as `aria-label` for the
   * close X). @default 'Dismiss'
   */
  dismissLabel?: string | undefined;
  /**
   * Click handler for the dismiss button + close X. Setting this
   * also surfaces the close X in the corner; leaving it undefined
   * renders the alert as persistent.
   */
  onDismiss?: (() => void) | undefined;
}

/**
 * Glaon Alert — single parametric primitive that dispatches to
 * `AlertFloating` or `AlertFullWidth` based on the `size` prop.
 * Matches the Figma `web-primitives-alert` `Color` × `Size` axes
 * 1:1.
 */
export function Alert({
  title,
  description,
  color = 'default',
  size = 'floating',
  actionType = 'button',
  confirmLabel,
  onConfirm,
  dismissLabel,
  onDismiss,
}: AlertProps) {
  // The kit renders the confirm / dismiss buttons solely on the
  // presence of their click handlers. Only forward `onConfirm` when
  // a `confirmLabel` is also set — otherwise the kit emits a
  // text-empty `<button>` and axe `button-name` fails. Same logic
  // for `onDismiss` against `dismissLabel`. Storybook auto-spies on
  // action argTypes, so without these guards every story would
  // render labelless buttons.
  const hasConfirm = confirmLabel !== undefined && confirmLabel !== '';
  const resolvedDismissLabel = dismissLabel ?? 'Dismiss';
  const hasDismiss = onDismiss !== undefined && resolvedDismissLabel !== '';

  if (size === 'full-width') {
    const props: {
      title: string;
      description: ReactNode;
      confirmLabel: string;
      color: AlertColor;
      actionType: AlertActionType;
      onConfirm?: () => void;
      onClose?: () => void;
      dismissLabel: string;
    } = {
      title,
      description: description ?? '',
      confirmLabel: hasConfirm ? confirmLabel : '',
      color,
      actionType,
      dismissLabel: resolvedDismissLabel,
    };
    if (hasConfirm && onConfirm !== undefined) props.onConfirm = onConfirm;
    if (hasDismiss) props.onClose = onDismiss;
    return <AlertFullWidth {...props} />;
  }

  const props: {
    title: string;
    description: ReactNode;
    confirmLabel: string;
    color: AlertColor;
    onConfirm?: () => void;
    onClose?: () => void;
    dismissLabel: string;
  } = {
    title,
    description: description ?? '',
    confirmLabel: hasConfirm ? confirmLabel : '',
    color,
    dismissLabel: resolvedDismissLabel,
  };
  if (hasConfirm && onConfirm !== undefined) props.onConfirm = onConfirm;
  if (hasDismiss) props.onClose = onDismiss;
  return <AlertFloating {...props} />;
}
