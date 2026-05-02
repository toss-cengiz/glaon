// `Tooltip.controls.ts` — single source of truth for Tooltip's
// variant matrix. Story (`Tooltip.stories.tsx`) imports the spec and
// spreads it into `meta.args` / `meta.argTypes`; MDX docs
// (`Tooltip.mdx`) reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const placementOptions = [
  'top',
  'top start',
  'top end',
  'bottom',
  'bottom start',
  'bottom end',
  'left',
  'left top',
  'left bottom',
  'right',
  'right top',
  'right bottom',
] as const;

const triggerOptions = ['focus', undefined] as const;

export const tooltipControls = {
  title: {
    type: 'text',
    default: 'Tooltip text',
    description:
      'Primary tooltip line — short, single-line hint. Renders as the label heading inside the popover surface.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  description: {
    type: 'text',
    description:
      'Optional second line shown below the `title`. Use sparingly — tooltips are for hints, not paragraphs (use Popover for richer copy).',
    category: 'Content',
  } satisfies ControlSpec<string>,
  placement: {
    type: 'select',
    options: placementOptions,
    default: 'top',
    description:
      'Preferred edge relative to the trigger. RAC will flip the tooltip automatically if the preferred placement would overflow the viewport — `shouldFlip` (kit-internal) drives this and is enabled by default.',
    category: 'Style',
  } satisfies ControlSpec<(typeof placementOptions)[number]>,
  arrow: {
    type: 'boolean',
    default: false,
    description:
      'Render a small caret pointing back at the trigger. Useful when the tooltip floats far enough from the trigger that the relationship is unclear.',
    category: 'Style',
  } satisfies ControlSpec<boolean>,
  delay: {
    type: 'number',
    min: 0,
    max: 2000,
    step: 100,
    default: 300,
    description:
      'Hover delay in ms before the tooltip opens. The default 300 ms is the kit recommendation; lower for keyboard-driven flows, higher for densely-tooltip-ed surfaces.',
    category: 'Behavior',
  } satisfies ControlSpec<number>,
  closeDelay: {
    type: 'number',
    min: 0,
    max: 2000,
    step: 100,
    default: 0,
    description:
      'Delay in ms before the tooltip dismisses after the cursor leaves. Bump to 100–200 ms when users frequently move from trigger to tooltip content.',
    category: 'Behavior',
  } satisfies ControlSpec<number>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Suppress the tooltip entirely (the trigger renders normally but no popover is wired up). Useful for conditional hints driven by parent state.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isOpen: {
    type: 'boolean',
    description:
      "Controlled open state. Pair with `onOpenChange` to manage state outside the component. Use sparingly — the kit's default hover/focus behaviour is usually right.",
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  defaultOpen: {
    type: 'boolean',
    default: false,
    description:
      'Initial open state for uncontrolled usage. The dedicated `OpenState` story sets this to `true` so Chromatic captures the open-tooltip snapshot; other stories render the closed trigger so the MDX docs page stays readable when all stories render side by side.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  offset: {
    type: 'number',
    min: 0,
    max: 40,
    step: 1,
    description:
      'Distance in px between the trigger and the tooltip surface, along the placement axis.',
    category: 'Style',
  } satisfies ControlSpec<number>,
  crossOffset: {
    type: 'number',
    min: -40,
    max: 40,
    step: 1,
    description:
      'Distance in px along the perpendicular axis. Negative values shift toward the start, positive toward the end.',
    category: 'Style',
  } satisfies ControlSpec<number>,
  trigger: {
    type: 'inline-radio',
    options: triggerOptions,
    description:
      '`focus` only opens the tooltip when the trigger is focused (keyboard); `undefined` (default) opens on both hover and focus per the WAI-ARIA tooltip pattern.',
    category: 'Behavior',
  } satisfies ControlSpec<(typeof triggerOptions)[number]>,
  onOpenChange: {
    type: false,
    action: 'open-changed',
    description: 'Fires when the open state changes (RAC contract — receives the new boolean).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  children: {
    type: false,
    description:
      'The trigger element. Pass a focusable child directly — RAC `<TooltipTrigger>` wires `aria-describedby` automatically. **Do not** wrap the trigger in another `<TooltipTrigger>` or `<AriaButton>` — that produces nested-interactive controls and fails axe.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
} as const;

// Kit-internal props that aren't useful as Storybook controls but
// flow through type-checking; covered by the F6 prop-coverage gate.
export const tooltipExcludeFromArgs = defineExcludeFromArgs([
  'shouldFlip',
  'arrowBoundaryOffset',
  'containerPadding',
  'shouldUpdatePosition',
  'isEntering',
  'isExiting',
  'UNSAFE_className',
  'UNSAFE_style',
  'translate',
  'slot',
] as const);
