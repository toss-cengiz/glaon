// `ButtonGroup.controls.ts` — single source of truth for ButtonGroup's
// variant matrix. Story (`ButtonGroup.stories.tsx`) imports the spec
// and spreads it into `meta.args` / `meta.argTypes`; MDX docs
// (`ButtonGroup.mdx`) reads the same spec via `<Controls />`.
//
// The control set covers the *root* (`<ButtonGroup>`) props only.
// `<ButtonGroup.Item>` props are documented in MDX and exercised
// through dedicated stories — Storybook's controls panel binds to
// the parametric `meta.component`, and exposing item props at root
// level would conflict with the per-item compose pattern.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md'] as const;

export const buttonGroupControls = {
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description:
      'Visual scale. `sm` (h-9) for dense filter bars; `md` (h-10, default) for primary view toggles.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  defaultValue: {
    type: 'text',
    default: 'day',
    description:
      'Initial selected item value (uncontrolled). The matching `<ButtonGroup.Item value="…">` renders pressed on first paint. Pair with `value` + `onChange` for controlled state instead.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  value: {
    type: 'text',
    description:
      'Controlled selected value. Pair with `onChange` to manage state outside the component. Use sparingly — uncontrolled `defaultValue` is enough for most filter bars.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      "Disable every segment in the group. Per-item `isDisabled` still cascades — this prop only sharpens, it can't enable an item the group has disabled.",
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  'aria-label': {
    type: 'text',
    default: 'Date range',
    description:
      'Accessible label for the group landmark (e.g. "Date range", "View mode"). Required when icon-only items are used so screen readers announce the group purpose.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  onChange: {
    type: false,
    action: 'changed',
    description:
      'Fires with the next selected value when the user picks a different segment. Required for controlled usage (paired with `value`).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  children: {
    type: false,
    description:
      'Compose with `<ButtonGroup.Item>` rows. Item props (`value`, `iconLeading`, `iconOnly`, `dot`, `isDisabled`, `aria-label`) are documented in the MDX page; story examples cover each axis.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
} as const;

export const buttonGroupExcludeFromArgs = defineExcludeFromArgs([] as const);
