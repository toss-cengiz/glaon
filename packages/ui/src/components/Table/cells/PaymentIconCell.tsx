// Payment icon cell — payment method glyph + label + optional
// secondary line (e.g. last4). Mirrors Figma "Type=Payment method
// icon" cell. The leading glyph today is a neutral credit-card icon;
// #309 Phase D ships per-brand artwork (Visa / MasterCard / AMEX /
// …) and consumers can swap once that lands by passing a `methodIcon`
// override.

import { CreditCard02 } from '@untitledui/icons';

import type { CellBaseProps, IconComponent } from './types';
import { joinClasses } from './types';

export interface PaymentIconCellProps extends CellBaseProps {
  /** Primary label (e.g. "Visa ending in 4242"). */
  primary: string;
  /** Secondary line (e.g. `Expires 06/27`). */
  secondary?: string;
  /**
   * Override the default credit-card glyph with brand artwork
   * (Visa / MasterCard / AMEX SVG components from #309 Phase D
   * once shipped).
   */
  methodIcon?: IconComponent;
}

export function PaymentIconCell({
  primary,
  secondary,
  methodIcon,
  size = 'md',
  className,
}: PaymentIconCellProps) {
  const Icon = methodIcon ?? CreditCard02;
  const iconBox = size === 'sm' ? 'size-8' : 'size-10';
  return (
    <div className={joinClasses('flex items-center gap-3', className)}>
      <span
        aria-hidden="true"
        className={joinClasses(
          'flex shrink-0 items-center justify-center rounded-md bg-secondary text-fg-quaternary',
          iconBox,
        )}
      >
        <Icon className={size === 'sm' ? 'size-5' : 'size-6'} />
      </span>
      <div className="flex flex-col">
        <span
          className={joinClasses(
            'truncate font-medium text-primary',
            size === 'sm' ? 'text-sm' : 'text-md',
          )}
        >
          {primary}
        </span>
        {secondary !== undefined ? (
          <span
            className={joinClasses('truncate text-tertiary', size === 'sm' ? 'text-xs' : 'text-sm')}
          >
            {secondary}
          </span>
        ) : null}
      </div>
    </div>
  );
}
