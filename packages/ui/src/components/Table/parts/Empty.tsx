// Glaon Table.Empty — parametric empty-state primitive for table
// bodies. Phase C of #323. The kit `<Table.Body>` accepts a
// `renderEmptyState` callback; this sub-component is the canonical
// Glaon UI for that callback (icon + title + description + action
// button), so consumers don't re-implement the standard layout.
//
// The sibling `<Table emptyState={…}>` root prop (wired in
// `Table.tsx`) auto-installs the supplied node as `renderEmptyState`
// on the body — pass either `<Table.Empty …/>` or any custom node.
//
// Mirrors Figma's Tables-page empty-state frames
// (https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=2218-469686).

import type { FC, MouseEventHandler, ReactNode } from 'react';

import { Inbox01 } from '@untitledui/icons';

import { Button } from '../../Button';

// `@untitledui/icons` declares per-file icon types; type the slot
// loosely to match `storybookIcons` and the kit's `IconComponent`.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type IconComponent = FC<any>;

export interface TableEmptyAction {
  /** Visible label. */
  label: string;
  /** Click handler — renders a `<button>`. Mutually exclusive with `href`. */
  onPress?: MouseEventHandler<HTMLButtonElement>;
  /** Link destination — renders an `<a>`. Mutually exclusive with `onPress`. */
  href?: string;
  /** Optional leading icon (e.g. `Plus` for "Invite member"). */
  icon?: IconComponent;
}

export interface TableEmptyProps {
  /**
   * Featured icon glyph rendered in a neutral tile above the title.
   * Defaults to a generic inbox icon — pair the prop with a domain-
   * specific glyph (`<Users01>` for team listings, `<File02>` for
   * file pickers) for clearer empty-state communication.
   */
  icon?: IconComponent;
  /** Headline text. */
  title: string;
  /** Optional body copy below the title. */
  description?: string;
  /** Optional action button. Provide either `onPress` or `href`. */
  action?: TableEmptyAction;
  /** Tailwind override hook for the wrapper. */
  className?: string;
  /** Slot for custom content rendered after the description (before the action). */
  children?: ReactNode;
}

function joinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

/**
 * Default empty-state UI for Glaon tables. Composes a featured icon
 * tile, headline, optional body copy, optional CTA. `role="status"`
 * + `aria-live="polite"` so the message is announced when the table
 * transitions from filled to empty rather than landing silently.
 */
export function TableEmpty({
  icon,
  title,
  description,
  action,
  className,
  children,
}: TableEmptyProps) {
  const Icon = icon ?? Inbox01;

  const buttonProps: Record<string, unknown> = { color: 'secondary', size: 'md' };
  if (action !== undefined) {
    if (action.icon !== undefined) buttonProps.iconLeading = action.icon;
    if (action.onPress !== undefined) buttonProps.onClick = action.onPress;
    if (action.href !== undefined) buttonProps.href = action.href;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={joinClasses('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}
    >
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-lg bg-secondary text-fg-quaternary"
      >
        <Icon className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-md font-semibold text-primary">{title}</p>
        {description !== undefined ? <p className="text-sm text-tertiary">{description}</p> : null}
      </div>
      {children}
      {action !== undefined ? <Button {...buttonProps}>{action.label}</Button> : null}
    </div>
  );
}
