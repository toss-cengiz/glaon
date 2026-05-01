// Glaon Banner — page-level announcement primitive. UUI's kit ships
// only concrete shared-asset templates (`banner-dual-action-default`
// + `banner-slim-default`) — no parametric primitive. Per the UUI
// Source Rule's "no kit source" exception, Glaon hand-rolls the
// component using those templates' class structures as canonical
// reference and parameterises content + theme. Tokens flow through
// Tailwind v4 `@theme` (UUI `theme.css`) and Glaon's brand override
// layer.
//
// Maps Figma's `web-primitives-banner` axes 1:1:
//   - `Type`:  text-field / single-action / dual-action / slim
//   - `Theme`: default (light) / brand (dark navy)
//
// Distinct from Alert (#303) — Alert is in-flow inline status; Banner
// is a page-level announcement strip pinned to the top / bottom of
// the page. Distinct from Toast — Toast is a transient overlay.
//
// Usage:
//
//   <Banner
//     type="dual-action"
//     theme="default"
//     title="We use third-party cookies in order to personalise your experience"
//     description={<>Read our <a href="/cookies">Cookie Policy</a>.</>}
//     primaryActionLabel="Allow"
//     onPrimaryAction={acceptCookies}
//     secondaryActionLabel="Decline"
//     onSecondaryAction={declineCookies}
//     onDismiss={hideBanner}
//   />

import type { ChangeEvent, FC, ReactNode } from 'react';

import { CheckVerified02 } from '@untitledui/icons';

// `@untitledui/icons` declares per-file icon types; type the slot
// loosely so callers can pass any kit / custom icon component.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type IconComponent = FC<any>;

export type BannerType = 'text-field' | 'single-action' | 'dual-action' | 'slim';
export type BannerTheme = 'default' | 'brand';
export type BannerInputType = 'email' | 'text' | 'url' | 'tel';

export interface BannerProps {
  /**
   * Layout discriminator. Mirrors Figma's `Type` axis 1:1.
   * @default 'single-action'
   */
  type?: BannerType | undefined;
  /**
   * Surface palette. Mirrors Figma's `Theme` axis. `default` is a
   * light tray with a ring; `brand` is a dark navy fill.
   * @default 'default'
   */
  theme?: BannerTheme | undefined;
  /** Bold lead-in text. Always set. */
  title: ReactNode;
  /**
   * Optional secondary copy. Use a ReactNode for inline links
   * (`Read our <a>Cookie Policy</a>`). Ignored for `type='slim'`
   * (slim renders title + inline link inline; pass the link inside
   * `title`).
   */
  description?: ReactNode | undefined;
  /**
   * Override the leading icon. Defaults to the kit `CheckVerified02`
   * glyph. Ignored for `type='slim'` (slim has no icon).
   */
  icon?: IconComponent | undefined;
  /** Label for the primary CTA (right side). */
  primaryActionLabel?: string | undefined;
  /** Click handler for the primary CTA. */
  onPrimaryAction?: (() => void) | undefined;
  /**
   * Label for the secondary CTA (left of the primary). Only renders
   * for `type='dual-action'`.
   */
  secondaryActionLabel?: string | undefined;
  /** Click handler for the secondary CTA. */
  onSecondaryAction?: (() => void) | undefined;
  /** Placeholder for the email/text input (`type='text-field'` only). */
  inputPlaceholder?: string | undefined;
  /** Native input type — drives mobile keyboard hint. @default 'email' */
  inputType?: BannerInputType | undefined;
  /** Controlled input value. Pair with `onInputChange`. */
  inputValue?: string | undefined;
  /** Initial input value for uncontrolled usage. */
  defaultInputValue?: string | undefined;
  /** Fires on every keystroke with the new string value. */
  onInputChange?: ((value: string) => void) | undefined;
  /**
   * Accessible label for the input (forwarded as `aria-label`).
   * Required when no visible label exists. @default 'Email'
   */
  inputAriaLabel?: string | undefined;
  /** Click handler for the close X. Setting this surfaces the close button. */
  onDismiss?: (() => void) | undefined;
  /** Accessible label for the close X. @default 'Dismiss' */
  dismissLabel?: string | undefined;
  /** Tailwind override hook for the outer container. */
  className?: string | undefined;
}

interface ThemeTokens {
  container: string;
  title: string;
  description: string;
  iconColor: string;
  closeText: string;
  closeHover: string;
  primaryButton: string;
  secondaryButton: string;
  inputClass: string;
  submitButton: string;
}

// Theme palettes — `default` mirrors the kit's
// `bg-secondary` / `ring-secondary_alt` / `shadow-lg` shared-asset
// vocabulary; `brand` swaps in dark-navy fill (`bg-utility-brand-700`)
// with white text and lighter brand-200 accents per Figma's brand
// banner reference.
const themeTokens: Record<BannerTheme, ThemeTokens> = {
  default: {
    container: 'bg-secondary text-secondary ring-1 ring-inset ring-secondary_alt shadow-lg',
    title: 'text-secondary',
    description: 'text-tertiary',
    iconColor: 'text-fg-brand-primary_alt',
    closeText: 'text-fg-quaternary',
    closeHover: 'hover:bg-primary_hover hover:text-fg-quaternary_hover',
    primaryButton:
      'bg-brand-solid text-white shadow-xs-skeuomorphic ring-1 ring-inset ring-transparent hover:bg-brand-solid_hover',
    secondaryButton:
      'bg-primary text-secondary shadow-xs-skeuomorphic ring-1 ring-inset ring-primary hover:bg-primary_hover',
    inputClass:
      'bg-primary text-primary placeholder:text-placeholder ring-1 ring-inset ring-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-fg-brand-primary',
    submitButton:
      'bg-primary text-secondary shadow-xs-skeuomorphic ring-1 ring-inset ring-primary hover:bg-primary_hover',
  },
  brand: {
    container: 'bg-utility-brand-700 text-white shadow-lg',
    title: 'text-white',
    description: 'text-utility-brand-200',
    iconColor: 'text-utility-brand-200',
    closeText: 'text-utility-brand-200',
    closeHover: 'hover:bg-white/10 hover:text-white',
    primaryButton:
      'bg-white text-utility-brand-700 shadow-xs-skeuomorphic ring-1 ring-inset ring-transparent hover:bg-utility-brand-50',
    secondaryButton: 'bg-transparent text-white ring-1 ring-inset ring-white/30 hover:bg-white/10',
    inputClass:
      'bg-utility-brand-800 text-white placeholder:text-utility-brand-200 ring-1 ring-inset ring-white/20 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-white',
    submitButton:
      'bg-white text-utility-brand-700 shadow-xs-skeuomorphic ring-1 ring-inset ring-transparent hover:bg-utility-brand-50',
  },
};

function joinClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(' ');
}

const buttonBase =
  'inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold whitespace-nowrap outline-focus-ring transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50';

function CloseX({
  theme,
  label,
  onPress,
  positioned,
}: {
  theme: BannerTheme;
  label: string;
  onPress: () => void;
  positioned: 'absolute' | 'absolute-md-static';
}) {
  const tokens = themeTokens[theme];
  const positionClass =
    positioned === 'absolute' ? 'absolute top-2 right-2' : 'absolute top-2 right-2 md:static';
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className={joinClasses(
        positionClass,
        'inline-flex size-8 shrink-0 items-center justify-center rounded-md outline-focus-ring transition focus-visible:outline-2 focus-visible:outline-offset-2',
        tokens.closeText,
        tokens.closeHover,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M3 3l10 10M13 3L3 13" />
      </svg>
    </button>
  );
}

/**
 * Glaon Banner — page-level announcement strip. Single parametric
 * primitive dispatching to the right layout via the `type` prop.
 */
export function Banner({
  type = 'single-action',
  theme = 'default',
  title,
  description,
  icon: IconOverride,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  inputPlaceholder = 'Enter your email',
  inputType = 'email',
  inputValue,
  defaultInputValue,
  onInputChange,
  inputAriaLabel = 'Email',
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
}: BannerProps) {
  const tokens = themeTokens[theme];
  const Icon = IconOverride ?? CheckVerified02;

  const hasPrimary =
    primaryActionLabel !== undefined &&
    primaryActionLabel.trim() !== '' &&
    onPrimaryAction !== undefined;
  const hasSecondary =
    type === 'dual-action' &&
    secondaryActionLabel !== undefined &&
    secondaryActionLabel.trim() !== '' &&
    onSecondaryAction !== undefined;
  const hasDismiss = onDismiss !== undefined;

  if (type === 'slim') {
    return (
      <div
        role="status"
        className={joinClasses(
          'relative flex items-center gap-4 rounded-xl p-4 md:gap-3 md:px-12 md:py-3',
          tokens.container,
          className,
        )}
      >
        <div className="flex w-0 flex-1 flex-col gap-0.5 md:flex-row md:justify-center md:gap-1.5 md:text-center">
          <p
            className={joinClasses('pr-8 text-sm font-semibold md:pr-0 md:truncate', tokens.title)}
          >
            {title}
          </p>
          {description !== undefined ? (
            <p className={joinClasses('text-sm md:truncate', tokens.description)}>{description}</p>
          ) : null}
        </div>
        {hasDismiss ? (
          <CloseX theme={theme} label={dismissLabel} onPress={onDismiss} positioned="absolute" />
        ) : null}
      </div>
    );
  }

  // text-field / single-action / dual-action share the icon + body
  // layout. Action area + input slot are type-specific.
  const inputProps: {
    type: BannerInputType;
    placeholder: string;
    'aria-label': string;
    className: string;
    value?: string;
    defaultValue?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  } = {
    type: inputType,
    placeholder: inputPlaceholder,
    'aria-label': inputAriaLabel,
    className: joinClasses('h-9 w-full min-w-0 rounded-md px-3 text-sm md:w-64', tokens.inputClass),
  };
  if (inputValue !== undefined) inputProps.value = inputValue;
  if (defaultInputValue !== undefined) inputProps.defaultValue = defaultInputValue;
  if (onInputChange !== undefined) {
    inputProps.onChange = (e: ChangeEvent<HTMLInputElement>) => {
      onInputChange(e.target.value);
    };
  }

  return (
    <div
      role="status"
      className={joinClasses(
        'relative flex flex-col gap-4 rounded-xl p-4 md:flex-row md:items-center md:gap-3 md:py-3 md:pr-3 md:pl-5',
        tokens.container,
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-3 md:w-0 md:flex-row md:items-center md:gap-3">
        <Icon aria-hidden="true" className={joinClasses('size-5 shrink-0', tokens.iconColor)} />
        <div className="flex flex-col gap-1 overflow-hidden lg:flex-row lg:gap-1.5">
          <p
            className={joinClasses('pr-8 text-sm font-semibold md:pr-0 md:truncate', tokens.title)}
          >
            {title}
          </p>
          {description !== undefined ? (
            <p className={joinClasses('text-sm md:truncate', tokens.description)}>{description}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {type === 'text-field' ? (
          <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:gap-2">
            <input {...inputProps} />
            {hasPrimary ? (
              <button
                type="button"
                onClick={onPrimaryAction}
                className={joinClasses(buttonBase, tokens.submitButton)}
              >
                {primaryActionLabel}
              </button>
            ) : null}
          </div>
        ) : null}

        {(type === 'single-action' || type === 'dual-action') && (hasPrimary || hasSecondary) ? (
          <div className="flex w-full flex-col-reverse gap-2 md:flex-row md:gap-3">
            {hasSecondary ? (
              <button
                type="button"
                onClick={onSecondaryAction}
                className={joinClasses(buttonBase, tokens.secondaryButton)}
              >
                {secondaryActionLabel}
              </button>
            ) : null}
            {hasPrimary ? (
              <button
                type="button"
                onClick={onPrimaryAction}
                className={joinClasses(buttonBase, tokens.primaryButton)}
              >
                {primaryActionLabel}
              </button>
            ) : null}
          </div>
        ) : null}

        {hasDismiss ? (
          <CloseX
            theme={theme}
            label={dismissLabel}
            onPress={onDismiss}
            positioned="absolute-md-static"
          />
        ) : null}
      </div>
    </div>
  );
}
