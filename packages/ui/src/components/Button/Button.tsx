// Web Button — inline style consumes the CSS custom properties emitted by
// F2 (`packages/ui/dist/tokens/web.css`). Variant matrix mirrors the kit:
// intent (primary | secondary | tertiary | destructive) × size (sm | md |
// lg) × state (default | hover | active | disabled | loading).
//
// Token consumption is intentionally string-based — `var(--brand-500)`,
// `var(--neutral-300)` — so a future `[data-theme='dark']` block in the
// emitted CSS lights up dark colors without component code changes.
//
// `loading` shows the spinner and suppresses click handlers; `leadingIcon`
// is hidden in that state to keep the affordance unambiguous.

import type { ButtonHTMLAttributes, CSSProperties, MouseEvent } from 'react';

import { DEFAULT_BUTTON_INTENT, DEFAULT_BUTTON_SIZE, type ButtonBaseProps } from './Button.types';

export interface ButtonProps
  extends ButtonBaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled'> {}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  border: '1px solid transparent',
  borderRadius: 6,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 120ms ease, border-color 120ms ease, color 120ms ease',
  fontFamily: 'inherit',
};

const intentStyle: Record<NonNullable<ButtonBaseProps['intent']>, CSSProperties> = {
  primary: {
    backgroundColor: 'var(--brand-500)',
    color: 'var(--base-white)',
    borderColor: 'var(--brand-500)',
  },
  secondary: {
    backgroundColor: 'var(--base-white)',
    color: 'var(--neutral-900)',
    borderColor: 'var(--neutral-300)',
  },
  tertiary: {
    backgroundColor: 'transparent',
    color: 'var(--brand-500)',
    borderColor: 'transparent',
  },
  destructive: {
    backgroundColor: 'var(--red-700)',
    color: 'var(--base-white)',
    borderColor: 'var(--red-700)',
  },
};

const sizeStyle: Record<NonNullable<ButtonBaseProps['size']>, CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: 13, minHeight: 28 },
  md: { padding: '8px 14px', fontSize: 14, minHeight: 36 },
  lg: { padding: '12px 20px', fontSize: 16, minHeight: 44 },
};

const inactiveStyle: CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

export function Button({
  intent = DEFAULT_BUTTON_INTENT,
  size = DEFAULT_BUTTON_SIZE,
  loading = false,
  disabled = false,
  leadingIcon,
  children,
  style,
  onClick,
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading;
  const composedStyle: CSSProperties = {
    ...baseStyle,
    ...intentStyle[intent],
    ...sizeStyle[size],
    ...(inactive ? inactiveStyle : null),
    ...style,
  };
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (inactive) return;
    onClick?.(event);
  };
  return (
    <button
      type="button"
      disabled={inactive}
      aria-busy={loading || undefined}
      style={composedStyle}
      onClick={handleClick}
      {...rest}
    >
      {loading ? (
        <Spinner size={size} />
      ) : leadingIcon !== undefined ? (
        <span aria-hidden="true">{leadingIcon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}

const SPINNER_SIZE: Record<NonNullable<ButtonBaseProps['size']>, number> = {
  sm: 12,
  md: 14,
  lg: 16,
};

function Spinner({ size }: { size: NonNullable<ButtonBaseProps['size']> }) {
  const px = SPINNER_SIZE[size];
  return (
    <span
      aria-hidden="true"
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        animation: 'glaon-button-spinner 720ms linear infinite',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

if (typeof document !== 'undefined') {
  const id = 'glaon-button-spinner-keyframes';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent =
      '@keyframes glaon-button-spinner { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }
}
