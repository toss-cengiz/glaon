// Glaon Alert — inline message primitive. Per CLAUDE.md's UUI Source
// Rule, the structural HTML/CSS is anchored on the Untitled UI kit
// `banner-slim-default` shared-asset under
// `packages/ui/src/components/shared-assets/banners/banner-slim-default.tsx`.
// That kit file is a concrete template (no props, hard-coded copy), so
// the Glaon wrap layer parameterizes its content (title / description /
// intent icon / dismissible) while preserving the kit's class structure
// (`bg-secondary` + `ring-secondary_alt` + `rounded-xl` + `shadow-lg`).
// Tokens flow through Tailwind v4 `@theme` (UUI `theme.css`) and Glaon's
// brand override layer.

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

export type AlertIntent = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  /** Bold first line of the alert. */
  title: ReactNode;
  /** Optional secondary line; rendered after the title. */
  description?: ReactNode;
  /** Severity / colour group for the leading icon. */
  intent?: AlertIntent;
  /** Override the default icon for the chosen intent. */
  icon?: IconComponent;
  /** Render a close button at the top-right corner. */
  dismissible?: boolean;
  /** Fires when the close button is clicked. */
  onDismiss?: () => void;
  /** Accessible label for the close button. Defaults to "Dismiss". */
  dismissLabel?: string;
  /** Override the kit's outer container className. */
  className?: string;
}

const intentIcons: Record<AlertIntent, IconComponent> = {
  info: InfoCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
};

const intentIconColor: Record<AlertIntent, string> = {
  info: 'text-fg-brand-primary_alt',
  success: 'text-fg-success-primary',
  warning: 'text-fg-warning-primary',
  danger: 'text-fg-error-primary',
};

export function Alert({
  title,
  description,
  intent = 'info',
  icon: IconOverride,
  dismissible = false,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
}: AlertProps) {
  const Icon = IconOverride ?? intentIcons[intent];
  const iconColor = intentIconColor[intent];

  const containerClass =
    'relative flex items-center gap-3 rounded-xl bg-secondary p-4 shadow-lg ring-1 ring-secondary_alt';

  return (
    <div role="status" className={className ? `${containerClass} ${className}` : containerClass}>
      <Icon aria-hidden="true" className={`size-5 shrink-0 ${iconColor}`} />
      <div className="flex w-0 flex-1 flex-col gap-0.5 md:flex-row md:gap-1.5">
        <p className="pr-8 text-sm font-semibold text-secondary md:pr-0">{title}</p>
        {description !== undefined ? <p className="text-sm text-tertiary">{description}</p> : null}
      </div>
      {dismissible ? (
        <div className="absolute top-2 right-2 flex shrink-0 items-center justify-center">
          <CloseButton
            size="sm"
            label={dismissLabel}
            {...(onDismiss ? { onPress: onDismiss } : {})}
          />
        </div>
      ) : null}
    </div>
  );
}
