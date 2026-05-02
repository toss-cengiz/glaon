// `Dropdown.controls.ts` — single source of truth for Dropdown's
// root-level prop matrix. Story (`Dropdown.stories.tsx`) imports the
// spec and spreads it into `meta.args` / `meta.argTypes`; MDX docs
// (`Dropdown.mdx`) reads the same spec via `<Controls />`.
//
// Note: Dropdown is a compound primitive — root-level props (open
// state + `trigger`) live here; per-item / per-section props
// (`label`, `icon`, `avatarUrl`, `selectionIndicator`, …) flow
// through `react-docgen-typescript` because of the static-property
// merge but belong on `<Dropdown.Item>` / `<Dropdown.Section>` /
// `<Dropdown.Popover>` etc. The F6 prop-coverage gate accepts them
// via the `excludeFromArgs` allowlist.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const triggerOptions = ['press', 'longPress'] as const;

export const dropdownControls = {
  defaultOpen: {
    type: 'boolean',
    default: false,
    description:
      'Initial open state for uncontrolled usage. Set `true` for snapshot stories so Chromatic captures the open-popover state.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isOpen: {
    type: 'boolean',
    description:
      "Controlled open state. Pair with `onOpenChange` to manage state outside the component. Usually unnecessary — RAC's `<MenuTrigger>` handles the click/keyboard contract by itself.",
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  onOpenChange: {
    type: false,
    action: 'open-changed',
    description:
      'Fires when the popover opens or closes (RAC `<MenuTrigger>` contract — receives the new boolean).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  trigger: {
    type: 'inline-radio',
    options: triggerOptions,
    default: 'press',
    description:
      "Activation gesture. `press` (default) opens the menu on click / Space / Enter; `longPress` requires a 500 ms hold (mobile-friendly long-press menus). RAC's contract handles touch + keyboard for both.",
    category: 'Behavior',
  } satisfies ControlSpec<(typeof triggerOptions)[number]>,
  children: {
    type: false,
    description:
      'Compose with a focusable trigger child (`<Button>` / `<Avatar>` / `<Dropdown.DotsButton>`) and a `<Dropdown.Popover>` containing a `<Dropdown.Menu>` of `<Dropdown.Item>` rows. The kit auto-wires `aria-expanded` / `aria-controls` between trigger and menu.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
} as const;

// Sub-component props (`Dropdown.Item`, `Dropdown.Popover`,
// `Dropdown.Menu`, `Dropdown.Section`, `Dropdown.DotsButton`) flow
// through `react-docgen-typescript` via the static-property merge
// but belong on the children, not the root. The F6 prop-coverage
// gate accepts them via this allowlist.
export const dropdownExcludeFromArgs = defineExcludeFromArgs([
  // Item-only
  'label',
  'addon',
  'icon',
  'avatarUrl',
  'selectionIndicator',
  'unstyled',
  'onAction',
  'textValue',
  'href',
  'target',
  // Popover-only
  'placement',
  'offset',
  'crossOffset',
  'shouldFlip',
  'arrowBoundaryOffset',
  'containerPadding',
  'shouldUpdatePosition',
  'isEntering',
  'isExiting',
  // Menu-only
  'items',
  'selectionMode',
  'selectedKeys',
  'defaultSelectedKeys',
  'disabledKeys',
  'disallowEmptySelection',
  'onSelectionChange',
  'dependencies',
  'autoFocus',
  // Section-only
  'title',
  // DotsButton + AriaButton-forwarded
  'onPress',
  'onPressStart',
  'onPressEnd',
  'onPressUp',
  'onPressChange',
  'onHoverStart',
  'onHoverEnd',
  'onHoverChange',
  'isDisabled',
  'isPending',
  'preventFocusOnPress',
  'excludeFromTabOrder',
  'form',
  'formAction',
  'formEncType',
  'formMethod',
  'formNoValidate',
  'formTarget',
  'name',
  'value',
  // RAC-forwarded
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'aria-haspopup',
  'aria-expanded',
  'aria-controls',
  'aria-pressed',
  'translate',
  'slot',
  'data-rac',
  'id',
  'key',
  'type',
  'rel',
  'download',
  'ping',
  'referrerPolicy',
  'routerOptions',
  'className',
  'style',
] as const);
