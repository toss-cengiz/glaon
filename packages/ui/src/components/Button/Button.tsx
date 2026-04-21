import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid transparent',
  borderRadius: 6,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 120ms ease, border-color 120ms ease',
};

const variantStyle: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
  secondary: {
    backgroundColor: '#ffffff',
    color: '#111827',
    borderColor: '#d1d5db',
  },
};

const sizeStyle: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: 13 },
  md: { padding: '8px 14px', fontSize: 14 },
  lg: { padding: '12px 20px', fontSize: 16 },
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  const composedStyle: React.CSSProperties = {
    ...baseStyle,
    ...variantStyle[variant],
    ...sizeStyle[size],
    opacity: disabled === true ? 0.5 : 1,
    cursor: disabled === true ? 'not-allowed' : 'pointer',
    ...style,
  };

  return (
    <button type="button" disabled={disabled} style={composedStyle} {...rest}>
      {children}
    </button>
  );
}
