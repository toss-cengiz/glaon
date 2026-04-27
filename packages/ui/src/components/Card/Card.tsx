// Glaon Card — surface primitive that hosts other content. UUI doesn't
// ship a generic `Card` base primitive; only marketing hero / CTA cards
// (e.g. `metrics-card-gray-light` pulled in P3). Glaon hand-rolls a
// parameterized Card using the kit's canonical surface vocabulary —
// `bg-primary` (or `bg-secondary` for the `muted` variant) +
// `ring-1 ring-secondary_alt` + `rounded-xl` + `shadow-{xs,lg}` — that
// every UUI surface in the catalogue uses. Tokens flow through
// Tailwind v4 `@theme` (UUI `theme.css`) and Glaon's brand override.
//
// Sub-components are exposed via the static-property pattern
// (`Card.Header` / `Card.Body` / `Card.Footer`) so consumers compose
// the regions inline without needing extra named imports.

import type { ReactNode } from 'react';

import { Button as AriaButton } from 'react-aria-components';

export type CardVariant = 'default' | 'elevated' | 'muted';

export interface CardProps {
  /**
   * Visual style of the surface.
   * - `default` — neutral background + subtle border + thin shadow.
   * - `elevated` — same background, dropped shadow for emphasis.
   * - `muted` — tinted background; useful for nested cards.
   * @default 'default'
   */
  variant?: CardVariant;
  /**
   * Render the card as a clickable surface (hover + keyboard focus +
   * `role="button"`). Use this for navigation tiles, selectable
   * options, etc.
   */
  interactive?: boolean;
  /** Fires when an interactive card is activated. */
  onPress?: () => void;
  /** Override the kit's outer container className. */
  className?: string;
  /** Card content. Compose with `Card.Header` / `Card.Body` / `Card.Footer`. */
  children: ReactNode;
}

export interface CardHeaderProps {
  className?: string;
  children: ReactNode;
}

export interface CardBodyProps {
  className?: string;
  children: ReactNode;
}

export interface CardFooterProps {
  className?: string;
  children: ReactNode;
}

const baseStyles = 'block rounded-xl overflow-hidden text-left';

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-primary ring-1 ring-secondary_alt shadow-xs',
  elevated: 'bg-primary ring-1 ring-secondary_alt shadow-lg',
  muted: 'bg-secondary ring-1 ring-secondary_alt shadow-xs',
};

// `cursor-pointer` + `transition-shadow` for the affordance, plus
// `outline-focus-ring` to opt into the kit's focus-visible token. The
// underlying RAC `<Button>` handles keyboard activation + the
// `role="button"` ARIA contract on its own.
const interactiveStyles =
  'cursor-pointer transition-shadow duration-150 hover:shadow-md outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2';

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

function CardRoot({
  variant = 'default',
  interactive = false,
  onPress,
  className,
  children,
}: CardProps) {
  const containerClass = joinClasses(
    baseStyles,
    variantStyles[variant],
    interactive && interactiveStyles,
    className,
  );

  if (interactive) {
    return (
      <AriaButton className={containerClass} {...(onPress ? { onPress } : {})}>
        {children}
      </AriaButton>
    );
  }
  return <div className={containerClass}>{children}</div>;
}

function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={joinClasses('px-6 pt-6 pb-4 border-b border-secondary_alt', className)}>
      {children}
    </div>
  );
}

function CardBody({ className, children }: CardBodyProps) {
  return <div className={joinClasses('px-6 py-6', className)}>{children}</div>;
}

function CardFooter({ className, children }: CardFooterProps) {
  return (
    <div className={joinClasses('px-6 pt-4 pb-6 border-t border-secondary_alt', className)}>
      {children}
    </div>
  );
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
