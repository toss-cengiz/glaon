// `SideNav.controls.ts` — single source of truth for SideNav's
// variant matrix. Story (`SideNav.stories.tsx`) imports the spec and
// spreads it into `meta.args` / `meta.argTypes`; MDX docs
// (`SideNav.mdx`) reads the same spec via `<Controls />`.
//
// Note: SideNavGroup-only (`label`) and SideNavItem-only props
// (`label`, `href`, `icon`, `badge`, `current`, `onClick`) belong on
// the child components, not the root `<SideNav>`. They flow through
// `react-docgen-typescript` because of the static-property merge,
// so they appear in `excludeFromArgs`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

export const sideNavControls = {
  collapsed: {
    type: 'boolean',
    default: false,
    description:
      'Reduce the width to icon-only (`w-16`). Useful as a drawer-style collapse on narrow viewports or in dense tablet layouts. Manage the toggle state in the parent — the SideNav itself is purely visual.',
    category: 'Style',
  } satisfies ControlSpec<boolean>,
  children: {
    type: false,
    description:
      'Compose with `<SideNav.Brand>` (top), one or more `<SideNav.Group label="…">` blocks (middle, each containing `<SideNav.Item>` rows), and `<SideNav.Footer>` (bottom — anchored via `mt-auto`).',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer `<aside>` container.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

// `react-docgen-typescript` walks the static-property namespace
// (Brand / Group / Item / Footer) and surfaces those sub-components'
// props on the merged root signature. They belong on the children,
// not the root — the F6 prop-coverage gate accepts them via this
// allowlist instead.
export const sideNavExcludeFromArgs = defineExcludeFromArgs([
  // SideNavGroup-only props.
  'label',
  // SideNavItem-only props.
  'href',
  'icon',
  'badge',
  'current',
  'onClick',
] as const);
