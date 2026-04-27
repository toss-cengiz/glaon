// Glaon Banner — page-level announcement primitive. Per CLAUDE.md's UUI
// Source Rule, the structural HTML/CSS is anchored on the Untitled UI
// kit `banner-dual-action-default` shared-asset under
// `packages/ui/src/components/shared-assets/banners/banner-dual-action-default.tsx`.
// That kit file is a concrete template (no props, hard-coded copy), so
// the Glaon wrap layer parameterizes its content (title / description /
// actions / intent icon / dismissible) while preserving the kit's class
// structure. Tokens flow through Tailwind v4 `@theme` (UUI `theme.css`)
// and Glaon's brand override layer.

import type { FC, ReactNode } from 'react';

import { AlertCircle, AlertTriangle, CheckCircle, InfoCircle } from '@untitledui/icons';

import { CloseButton } from '../base/buttons/close-button';

// `@untitledui/icons` declares each icon's `Props` interface in a per-file
// module that isn't re-exported, so deriving an exact type against the
// raw imports trips TS4023. The icon picker (`icons/storybook.ts`) uses
// the same `FC<any>` workaround for the same reason.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type IconComponent = FC<any>;

export type BannerIntent = 'info' | 'success' | 'warning' | 'danger';

export interface BannerProps {
  /** Bold lead-in text. */
  title: ReactNode;
  /** Optional secondary line; rendered after the title. */
  description?: ReactNode;
  /** Severity / colour group for the leading icon. */
  intent?: BannerIntent;
  /** Override the default icon for the chosen intent. */
  icon?: IconComponent;
  /**
   * Action slot — typically one or two `<Button>` elements. Rendered to
   * the right of the message on desktop, below it on mobile.
   */
  actions?: ReactNode;
  /** Render a close button at the top-right corner. */
  dismissible?: boolean;
  /** Fires when the close button is clicked. */
  onDismiss?: () => void;
  /** Accessible label for the close button. Defaults to "Dismiss". */
  dismissLabel?: string;
  /** Override the kit's outer container className. */
  className?: string;
}

const intentIcons: Record<BannerIntent, IconComponent> = {
  info: InfoCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
};

const intentIconColor: Record<BannerIntent, string> = {
  info: 'text-fg-brand-primary_alt',
  success: 'text-fg-success-primary',
  warning: 'text-fg-warning-primary',
  danger: 'text-fg-error-primary',
};

export function Banner({
  title,
  description,
  intent = 'info',
  icon: IconOverride,
  actions,
  dismissible = false,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
}: BannerProps) {
  const Icon = IconOverride ?? intentIcons[intent];
  const iconColor = intentIconColor[intent];

  const containerClass =
    'relative flex flex-col gap-4 rounded-xl bg-secondary p-4 shadow-lg ring-1 ring-secondary_alt md:flex-row md:items-center md:gap-3 md:py-3 md:pr-3 md:pl-5';

  return (
    <div role="status" className={className ? `${containerClass} ${className}` : containerClass}>
      <div className="flex flex-1 flex-col gap-3 md:w-0 md:flex-row md:items-center md:gap-2">
        <Icon aria-hidden="true" className={`size-5 shrink-0 ${iconColor}`} />
        <div className="flex flex-col gap-2 overflow-hidden lg:flex-row lg:gap-1.5">
          <p className="pr-8 text-sm font-semibold text-secondary md:pr-0">{title}</p>
          {description !== undefined ? (
            <p className="text-sm text-tertiary">{description}</p>
          ) : null}
        </div>
      </div>
      {actions !== undefined || dismissible ? (
        <div className="flex gap-2">
          {actions !== undefined ? (
            <div className="flex w-full flex-col-reverse gap-2 md:flex-row md:gap-3">{actions}</div>
          ) : null}
          {dismissible ? (
            <div className="absolute top-2 right-2 flex shrink-0 items-center justify-center md:static">
              <CloseButton
                size="sm"
                label={dismissLabel}
                {...(onDismiss ? { onPress: onDismiss } : {})}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
