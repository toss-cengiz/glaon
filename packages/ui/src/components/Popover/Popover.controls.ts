// `Popover.controls.ts` — single source of truth for Popover's
// variant matrix. Story (`Popover.stories.tsx`) imports the spec and
// spreads it into `meta.args` / `meta.argTypes`; MDX docs
// (`Popover.mdx`) reads the same spec via `<Controls />`.
//
// Note: `placement` / `offset` / `crossOffset` and the rich-content
// styling live on `<Popover.Content>` (they extend RAC `PopoverProps`),
// not on the root `<Popover>`. They appear in `excludeFromArgs`
// rather than `argTypes` since `react-docgen-typescript` surfaces
// them via the static-property merge but they belong on the child.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

export const popoverControls = {
  isOpen: {
    type: 'boolean',
    description:
      "Controlled open state. Pair with `onOpenChange` to manage state outside the component. Use sparingly — RAC's default click-trigger / Escape / click-outside contract is usually right.",
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  defaultOpen: {
    type: 'boolean',
    default: false,
    description:
      'Initial open state for uncontrolled usage. Set `true` for snapshot stories so Chromatic captures the open canvas.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  onOpenChange: {
    type: false,
    action: 'open-changed',
    description:
      'Fires when the open state changes (RAC `<DialogTrigger>` contract — receives the new boolean).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  children: {
    type: false,
    description:
      'Compose with `<Popover.Trigger>` (a focusable child — Button, link, etc.) and `<Popover.Content placement="…">` (any rich React tree). RAC wires `aria-expanded` / `aria-controls` between trigger and surface automatically.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
} as const;

// `<Popover.Content>` props (placement / offset / crossOffset / kit-
// internal animation slots) flow through `react-docgen-typescript`
// because of the static-property merge but belong on the child
// component. The F6 prop-coverage gate accepts them via this
// allowlist.
export const popoverExcludeFromArgs = defineExcludeFromArgs([
  // PopoverContent-only props (set on `<Popover.Content placement=… offset=…>`).
  'placement',
  'offset',
  'crossOffset',
  'shouldFlip',
  'arrowBoundaryOffset',
  'containerPadding',
  'shouldUpdatePosition',
  'isEntering',
  'isExiting',
  'className',
  'style',
  'UNSAFE_className',
  'UNSAFE_style',
  // RAC-forwarded.
  'translate',
  'slot',
  'data-rac',
] as const);
