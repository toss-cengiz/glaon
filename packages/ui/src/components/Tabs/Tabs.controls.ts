// `Tabs.controls.ts` — single source of truth for Tabs's variant
// matrix. Story (`Tabs.stories.tsx`) imports the spec and spreads it
// into `meta.args` / `meta.argTypes`; MDX docs (`Tabs.mdx`) reads
// the same spec via `<Controls />`.
//
// Note: the visual variant (`type` — line / underline / button-brand /
// button-gray) and `size` are TabList-only props, set on
// `<Tabs.List>` rather than the root `<Tabs>`. They appear in
// `excludeFromArgs` so the F6 prop-coverage gate stays green without
// surfacing irrelevant root-level controls.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const orientationOptions = ['horizontal', 'vertical'] as const;
const keyboardActivationOptions = ['automatic', 'manual'] as const;

export const tabsControls = {
  defaultSelectedKey: {
    type: 'text',
    default: 'overview',
    description:
      'Initial selected tab `id` for uncontrolled usage. Leave `selectedKey` undefined when using this so RAC manages selection internally.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  selectedKey: {
    type: 'text',
    description:
      'Controlled selected tab `id`. Pair with `onSelectionChange` to manage state outside the component.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  orientation: {
    type: 'inline-radio',
    options: orientationOptions,
    default: 'horizontal',
    description:
      'Layout direction. `horizontal` (default) renders the TabList above the panels; `vertical` renders the list to the side (compose with flex/grid in the parent).',
    category: 'Style',
  } satisfies ControlSpec<(typeof orientationOptions)[number]>,
  keyboardActivation: {
    type: 'inline-radio',
    options: keyboardActivationOptions,
    default: 'manual',
    description:
      'Arrow-key behaviour. `manual` (default) moves focus only — Space / Enter activates the focused tab. `automatic` activates on focus, mirroring the WAI-ARIA "automatic" pattern (use sparingly — keyboard users can scrub through panels by accident).',
    category: 'A11y',
  } satisfies ControlSpec<(typeof keyboardActivationOptions)[number]>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Disable the entire Tabs group. Individual tabs can be disabled via `<Tabs.Trigger isDisabled>`.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  onSelectionChange: {
    type: false,
    action: 'selection-changed',
    description: 'Fires when the selected tab changes (RAC contract — receives the new key).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  children: {
    type: false,
    description:
      'Compose with `<Tabs.List>` (containing `<Tabs.Trigger>` rows) and one `<Tabs.Content id="…">` per tab. The static-property namespace mirrors the Radix idiom while the kit re-exports `Tab` / `TabList` / `TabPanel` for direct use.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

// `react-docgen-typescript` walks the static-property namespace on
// `Tabs` (Tabs.List, Tabs.Trigger, Tabs.Content) and surfaces their
// own props on the root signature too. The TabList-only props
// (`size`, `type`, `items`, `fullWidth`) belong on `<Tabs.List>` per
// the Glaon API; expose them via the sub-component story rather than
// the root meta. The remaining entries are RAC-forwarded props.
export const tabsExcludeFromArgs = defineExcludeFromArgs([
  // TabList-only props (set on `<Tabs.List type=… size=… fullWidth>`).
  'size',
  'type',
  'items',
  'fullWidth',
  // RAC-forwarded props not useful as Storybook knobs.
  'autoFocus',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'translate',
  'slot',
  'data-rac',
  'ref',
  'id',
  'style',
  'dir',
] as const);
