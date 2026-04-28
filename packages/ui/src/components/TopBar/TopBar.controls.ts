// `TopBar.controls.ts` — single source of truth for TopBar's variant
// matrix. Story (`TopBar.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`TopBar.mdx`)
// reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

export const topBarControls = {
  compact: {
    type: 'boolean',
    default: false,
    description:
      'Reduce the bar height (`h-12` instead of `h-16`). Use for dense dashboards or wall-tablet layouts where vertical real estate is at a premium.',
    category: 'Style',
  } satisfies ControlSpec<boolean>,
  children: {
    type: false,
    description:
      'Compose with `<TopBar.Brand>` (left), `<TopBar.Nav>` (centre — collapses below `md`), and `<TopBar.Actions>` (right). The flex layout assigns slots regardless of declaration order.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer `<header>` container.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

export const topBarExcludeFromArgs = defineExcludeFromArgs([] as const);
