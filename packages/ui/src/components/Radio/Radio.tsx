// Glaon Radio + Radio.Card — wrap layer over the Untitled UI kit.
//
// The kit (`packages/ui/src/components/base/radio-buttons/radio-buttons.tsx`)
// gives us `RadioButton` (radio + optional label / hint). The wrap
// here re-exports it under the shorter `Radio` name and adds the
// `Radio.Card` namespace property — a bordered card variant for
// plan / option pickers where the radio is secondary and the card
// itself is the click target.
//
// `RadioGroup` lives in its own sibling file (`RadioGroup.tsx`) so
// the F6 prop-coverage gate can match each Glaon wrap against its
// own controls + stories file independently.

import { type ReactNode } from 'react';
import { Radio as AriaRadio, type RadioProps as AriaRadioProps } from 'react-aria-components';

import { RadioButton as KitRadio, RadioButtonBase } from '../base/radio-buttons/radio-buttons';
import { cx } from '../../utils/cx';

// ─── Card variant ───────────────────────────────────────────────────────

interface RadioCardProps extends Omit<AriaRadioProps, 'children'> {
  /** Card title. */
  label: ReactNode;
  /** Secondary description rendered under the label. */
  description?: ReactNode;
  /** Trailing slot — typically a Badge or price tag. */
  trailing?: ReactNode;
}

function RadioCard({ label, description, trailing, className, ...props }: RadioCardProps) {
  return (
    <AriaRadio
      {...props}
      className={(state) =>
        cx(
          'group/radio-card relative flex cursor-pointer items-start gap-3 rounded-lg border bg-primary p-4 transition-colors',
          'border-secondary',
          !state.isDisabled && 'hover:bg-primary_hover hover:border-secondary_hover',
          state.isSelected && 'border-brand bg-brand-primary_alt',
          state.isFocusVisible && 'outline-2 outline-offset-2 outline-focus-ring',
          state.isDisabled && 'cursor-not-allowed opacity-60',
          typeof className === 'function' ? className(state) : className,
        )
      }
    >
      {(state) => (
        <>
          <RadioButtonBase
            size="md"
            isSelected={state.isSelected}
            isDisabled={state.isDisabled}
            isFocusVisible={false}
            className="mt-0.5"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p
              className={cx(
                'text-sm font-semibold',
                // Selected `bg-brand-primary_alt` (light blue) needs a
                // darker label colour to clear axe `color-contrast` (4.5:1).
                // kit Tabs `button-brand` uses `text-brand-secondary` for
                // the same surface — same approach here.
                state.isSelected ? 'text-brand-secondary' : 'text-secondary',
              )}
            >
              {label}
            </p>
            {description !== undefined && (
              <p
                className={cx(
                  'text-sm',
                  // `text-tertiary` (#525252) on `bg-brand-primary_alt`
                  // clocks 4.05:1 — fails axe. Bump to `text-secondary`
                  // (darker grey) on the selected tinted surface.
                  state.isSelected ? 'text-secondary' : 'text-tertiary',
                )}
              >
                {description}
              </p>
            )}
          </div>
          {trailing !== undefined && (
            <div className="ml-auto flex shrink-0 items-center">{trailing}</div>
          )}
        </>
      )}
    </AriaRadio>
  );
}

// Static-property namespace so consumers reach the card variant
// inline, mirroring the Modal / Tabs idiom:
//
//   <RadioGroup label="Plan">
//     <Radio.Card value="free" label="Free" description="$0 / month" />
//     <Radio.Card value="pro"  label="Pro"  description="$30 / month" />
//   </RadioGroup>

type RadioNamespace = typeof KitRadio & {
  Card: typeof RadioCard;
};

export const Radio: RadioNamespace = Object.assign(KitRadio, { Card: RadioCard });
