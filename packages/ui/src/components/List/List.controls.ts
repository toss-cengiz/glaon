// `List.controls.ts` — single source of truth for List's variant
// matrix. Story (`List.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`List.mdx`)
// reads the same spec via `<Controls />`.
//
// Note: ListItem-only props (`leading`, `trailing`, `onClick`,
// `current`) and ListItemAction-only props belong on the child
// components, not the root `<List>`. They flow through
// `react-docgen-typescript` because of the static-property merge,
// so they appear in `excludeFromArgs`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

export const listControls = {
  dividers: {
    type: 'boolean',
    default: false,
    description:
      'Render thin border dividers between items (`divide-y`). Useful for settings panels, transaction logs, or any layout where row boundaries help scanning.',
    category: 'Style',
  } satisfies ControlSpec<boolean>,
  bordered: {
    type: 'boolean',
    default: false,
    description:
      'Wrap the list in a card surface (`bg-primary` + ring + rounded). Use when the list sits on a busy background; combine with `dividers` for the canonical "settings card" look.',
    category: 'Style',
  } satisfies ControlSpec<boolean>,
  emptyState: {
    type: false,
    description:
      'Custom node shown when the list has no children. Falls back to a centred "No items to show." caption — override for product-specific empty states ("No devices yet" with a CTA, etc.).',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  children: {
    type: false,
    description:
      'Compose with `<List.Item leading={…} trailing={…}>` rows. The kit auto-renders `<ul role="list">` so axe sees the list semantics; an interactive item (`onClick`) gets keyboard / focus / hover styling automatically.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer container.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

// `react-docgen-typescript` walks the static-property namespace
// (`List.Item`, `List.ItemAction`) and surfaces those sub-components'
// props on the merged root signature. They belong on the children,
// not the root — the F6 prop-coverage gate accepts them via this
// allowlist.
export const listExcludeFromArgs = defineExcludeFromArgs([
  // ListItem-only props.
  'leading',
  'trailing',
  'onClick',
  'current',
] as const);
