// Glaon Notification — in-app activity feed item. UUI's kit ships
// only `application/notifications`-flavoured templates, no generic
// primitive — so per the UUI Source Rule's "no kit source" exception
// (TopBar / SideNav / Card / BadgeGroup pattern), Glaon hand-rolls
// a parameterised wrap using kit surface vocabulary as canonical
// reference (`bg-primary` + `rounded-xl` + `ring-secondary_alt` +
// `shadow-xs` + FeaturedIcon for icon variants).
//
// Maps Figma's `web-primitives-notification` `Type` axis 1:1:
//   - `primary-icon` (brand-coloured FeaturedIcon)
//   - `gray-icon`
//   - `success-icon`
//   - `warning-icon`
//   - `error-icon`
//   - `no-icon`
//   - `progress-indicator` (file upload / download)
//   - `avatar` (user activity, e.g. Olivia commented…)
//   - `image` (richer media, e.g. content card)
//
// Distinct from Toast (P16) — Toast is a transient overlay; this is
// an in-app feed item rendered inside an inbox / activity panel /
// notification drawer.
//
// Usage:
//
//   <Notification
//     type="avatar"
//     avatarSrc="…"
//     title="Olivia commented on your file"
//     description="“Looks great — let's ship it 🚀”"
//     timestamp="2 min ago"
//     primaryActionLabel="Reply"
//     onPrimaryAction={() => openThread(id)}
//     onDismiss={() => markAsRead(id)}
//   />

import type { FC, ReactNode } from 'react';

import { AlertCircle, AlertTriangle, CheckCircle, InfoCircle } from '@untitledui/icons';

import { Avatar } from '../Avatar';
import { CloseButton } from '../base/buttons/close-button';
import { FeaturedIcon } from '../foundations/featured-icon/featured-icon';

// `@untitledui/icons` declares per-file icon types; type the slot
// loosely so consumers can pass any kit / custom icon component.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type IconComponent = FC<any>;

export type NotificationType =
  | 'primary-icon'
  | 'gray-icon'
  | 'success-icon'
  | 'warning-icon'
  | 'error-icon'
  | 'no-icon'
  | 'progress-indicator'
  | 'avatar'
  | 'image';

export interface NotificationProps {
  /**
   * Leading-visual discriminator. Mirrors Figma's `Type` axis 1:1.
   * @default 'primary-icon'
   */
  type?: NotificationType | undefined;
  // -- Icon slot (used by `*-icon` types) -------------------------
  /**
   * Glyph for `*-icon` types. Defaults: `info` for primary/gray/no,
   * `check` for success, `triangle` for warning, `circle` for error.
   */
  icon?: IconComponent | undefined;
  // -- Avatar slot (used by `type='avatar'`) ----------------------
  avatarSrc?: string | undefined;
  avatarAlt?: string | undefined;
  avatarInitials?: string | undefined;
  // -- Image slot (used by `type='image'`) ------------------------
  imageSrc?: string | undefined;
  imageAlt?: string | undefined;
  // -- Progress slot (used by `type='progress-indicator'`) --------
  /** 0..100; the kit renders a horizontal progress bar under the body. */
  progress?: number | undefined;
  /** Optional caption next to the progress bar (e.g. "12.5 MB / 50 MB"). */
  progressLabel?: ReactNode | undefined;
  // -- Content ---------------------------------------------------
  title: ReactNode;
  description?: ReactNode | undefined;
  /** Inline subtle text shown next to the title (e.g. "2 min ago"). */
  timestamp?: ReactNode | undefined;
  // -- Actions ---------------------------------------------------
  primaryActionLabel?: string | undefined;
  onPrimaryAction?: (() => void) | undefined;
  secondaryActionLabel?: string | undefined;
  onSecondaryAction?: (() => void) | undefined;
  onDismiss?: (() => void) | undefined;
  /** @default 'Dismiss' */
  dismissLabel?: string | undefined;
  // -- Override --------------------------------------------------
  className?: string | undefined;
}

const featuredIconColor: Record<
  Exclude<NotificationType, 'no-icon' | 'progress-indicator' | 'avatar' | 'image'>,
  'brand' | 'gray' | 'success' | 'warning' | 'error'
> = {
  'primary-icon': 'brand',
  'gray-icon': 'gray',
  'success-icon': 'success',
  'warning-icon': 'warning',
  'error-icon': 'error',
};

const defaultIcon: Record<
  Exclude<NotificationType, 'no-icon' | 'progress-indicator' | 'avatar' | 'image'>,
  IconComponent
> = {
  'primary-icon': InfoCircle,
  'gray-icon': InfoCircle,
  'success-icon': CheckCircle,
  'warning-icon': AlertTriangle,
  'error-icon': AlertCircle,
};

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

/**
 * Glaon Notification — in-app feed item. Single parametric primitive
 * dispatching to the right leading-visual layout via the `type` prop.
 */
export function Notification({
  type = 'primary-icon',
  icon,
  avatarSrc,
  avatarAlt,
  avatarInitials,
  imageSrc,
  imageAlt,
  progress,
  progressLabel,
  title,
  description,
  timestamp,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
}: NotificationProps) {
  const containerClass = joinClasses(
    'relative flex w-full max-w-md gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary_alt',
    className,
  );

  const leading = renderLeading({
    type,
    icon,
    avatarSrc,
    avatarAlt,
    avatarInitials,
    imageSrc,
    imageAlt,
  });

  const showActions = primaryActionLabel !== undefined || secondaryActionLabel !== undefined;
  const showProgress = type === 'progress-indicator';

  return (
    <div role="status" className={containerClass}>
      {leading}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-2 pr-6">
          <p className="text-sm font-semibold text-primary">{title}</p>
          {timestamp !== undefined ? (
            <span className="shrink-0 text-xs text-tertiary">{timestamp}</span>
          ) : null}
        </div>
        {description !== undefined ? <p className="text-sm text-tertiary">{description}</p> : null}
        {showProgress ? (
          <div className="mt-2 flex flex-col gap-1">
            <div
              role="progressbar"
              aria-valuenow={progress ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
            >
              <div
                className="h-full rounded-full bg-fg-brand-primary_alt transition-[width]"
                style={{ width: `${(progress ?? 0).toString()}%` }}
              />
            </div>
            {progressLabel !== undefined ? (
              <p className="text-xs text-tertiary">{progressLabel}</p>
            ) : null}
          </div>
        ) : null}
        {showActions ? (
          <div className="mt-2 flex gap-3">
            {secondaryActionLabel !== undefined ? (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="text-sm font-semibold text-secondary outline-focus-ring transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {secondaryActionLabel}
              </button>
            ) : null}
            {primaryActionLabel !== undefined ? (
              <button
                type="button"
                onClick={onPrimaryAction}
                className="text-sm font-semibold text-fg-brand-primary_alt outline-focus-ring transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {primaryActionLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {onDismiss !== undefined ? (
        <CloseButton
          size="sm"
          label={dismissLabel}
          onPress={onDismiss}
          className="absolute top-2 right-2"
        />
      ) : null}
    </div>
  );
}

function renderLeading({
  type,
  icon,
  avatarSrc,
  avatarAlt,
  avatarInitials,
  imageSrc,
  imageAlt,
}: {
  type: NotificationType;
  icon: IconComponent | undefined;
  avatarSrc: string | undefined;
  avatarAlt: string | undefined;
  avatarInitials: string | undefined;
  imageSrc: string | undefined;
  imageAlt: string | undefined;
}): ReactNode {
  if (type === 'no-icon') return null;
  if (type === 'progress-indicator') {
    return null;
  }
  if (type === 'avatar') {
    const props: { src?: string | null; alt?: string; initials?: string } = {};
    if (avatarSrc !== undefined) props.src = avatarSrc;
    else props.src = null;
    if (avatarAlt !== undefined) props.alt = avatarAlt;
    if (avatarInitials !== undefined) props.initials = avatarInitials;
    return <Avatar size="md" {...props} />;
  }
  if (type === 'image') {
    return (
      <img
        src={imageSrc ?? ''}
        alt={imageAlt ?? ''}
        className="size-10 shrink-0 rounded-md object-cover"
      />
    );
  }
  // *-icon types — `type` is already narrowed to the icon variants
  // by the early returns above.
  const iconKey = type;
  const Icon = icon ?? defaultIcon[iconKey];
  return (
    <FeaturedIcon
      size="md"
      color={featuredIconColor[iconKey]}
      theme={iconKey === 'gray-icon' ? 'modern' : 'outline'}
      icon={Icon}
    />
  );
}
