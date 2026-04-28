// `Drawer.controls.ts` — single source of truth for Drawer's variant
// matrix. Story (`Drawer.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Drawer.mdx`)
// reads the same spec via `<Controls />`.
//
// Note: `side`, `size`, `isDismissable`, `isKeyboardDismissDisabled`
// (and the kit-internal animation slots) live on `<Drawer.Content>`
// (which extends RAC `ModalOverlayProps`), not on the root
// `<Drawer>`. They flow through `react-docgen-typescript` because of
// the static-property merge but stay in `excludeFromArgs`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

export const drawerControls = {
  isOpen: {
    type: 'boolean',
    description:
      "Controlled open state. Pair with `onOpenChange` to manage state outside the component. Usually unnecessary — RAC's `<DialogTrigger>` handles the click-trigger / Escape / click-outside contract by itself.",
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  defaultOpen: {
    type: 'boolean',
    default: false,
    description:
      'Initial open state for uncontrolled usage. Set `true` for snapshot stories so Chromatic captures the open panel with its trapped focus state.',
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
      'Compose with `<Drawer.Trigger>` (a focusable child — Button, link, etc.) and `<Drawer.Content side="…" size="…">` containing `<Drawer.Header>` / `<Drawer.Body>` / `<Drawer.Footer>`. The kit\'s `<DialogTrigger>` wires `aria-expanded` / `aria-controls` automatically.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
} as const;

// `<Drawer.Content>` props (side, size, dismiss flags, animation
// slots) and the kit's RAC-forwarded slots flow through
// `react-docgen-typescript` because of the static-property merge but
// belong on the children. The F6 prop-coverage gate accepts them via
// this allowlist.
export const drawerExcludeFromArgs = defineExcludeFromArgs([
  // DrawerContent-only props (set on `<Drawer.Content side=… size=… isDismissable=…>`).
  'side',
  'size',
  'isDismissable',
  'isKeyboardDismissDisabled',
  'shouldCloseOnInteractOutside',
  'isEntering',
  'isExiting',
  'className',
  'style',
  // Header / Body / Footer-only.
  'ref',
  // RAC-forwarded.
  'UNSAFE_className',
  'UNSAFE_style',
  'translate',
  'slot',
  'data-rac',
] as const);
