// `VerificationCodeInput.controls.ts` — single source of truth for
// VerificationCodeInput's prop matrix. Story imports the spec and
// spreads it into `meta.args` / `meta.argTypes`; MDX docs reads the
// same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md', 'lg'] as const;

export const verificationCodeInputControls = {
  label: {
    type: 'text',
    default: 'Verification code',
    description:
      'Visible label rendered above the cell row. Always provide one — labels satisfy axe `label` and pair the row with assistive tech automatically.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  hint: {
    type: 'text',
    description:
      'Helper text rendered below the row — re-styles red when `isInvalid`. Use to surface "Code expired" / "Wrong code" / etc.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description:
      'Visual scale. `sm` for in-line OTP confirmation cards; `md` (default) for dedicated verification screens; `lg` for splash / boot flows.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  digits: {
    type: 'number',
    min: 1,
    max: 12,
    step: 1,
    default: 6,
    description:
      'Number of cells. Figma frame ships 4 / 6; any positive integer works. Pasting a code longer than `digits` truncates to fit.',
    category: 'Style',
  } satisfies ControlSpec<number>,
  defaultValue: {
    type: 'text',
    description:
      'Initial value (uncontrolled). Non-digit characters are stripped on render — `1 2-3 4` → `1234`.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  value: {
    type: 'text',
    description:
      'Controlled full string value. Pair with `onChange` to manage state outside the field.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  isInvalid: {
    type: 'boolean',
    default: false,
    description:
      'Surface validation error styling (red ring on every cell + red `hint`). Pair with a `hint` describing the failure.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Block all interaction. The native `disabled` attribute is forwarded to every cell so axe + assistive tech treat the row as inert.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  ariaLabel: {
    type: 'text',
    default: 'Verification code',
    description:
      'Accessible label for the cell row. Used both as the `<div role="group">` `aria-label` and as the prefix for each cell\'s `aria-label` ("Verification code digit 1 of 6").',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  name: {
    type: 'text',
    description:
      'Form field name forwarded to a hidden mirror `<input>` so the field participates in native form submission alongside the visible cells.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  onChange: {
    type: false,
    action: 'changed',
    description: 'Fires on every keystroke / paste with the joined string value (digits only).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onComplete: {
    type: false,
    action: 'completed',
    description:
      'Fires once every cell is filled (`length === digits`). Typical place to call the verify endpoint.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  ref: {
    type: false,
    description: 'Forwarded ref to the wrapping `<div>`.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
} as const;

export const verificationCodeInputExcludeFromArgs = defineExcludeFromArgs([] as const);
