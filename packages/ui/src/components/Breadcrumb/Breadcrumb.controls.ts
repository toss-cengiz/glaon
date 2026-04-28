// `Breadcrumb.controls.ts` — single source of truth for Breadcrumb's
// variant matrix. Story (`Breadcrumb.stories.tsx`) imports the spec
// and spreads it into `meta.args` / `meta.argTypes`; MDX docs
// (`Breadcrumb.mdx`) reads the same spec via `<Controls />`.
//
// Note: BreadcrumbItem-only props (`href`, `icon`, `isEllipsis`,
// `avatarSrc`, `onClick`) and BreadcrumbAccountItem-only props
// (`items`, `selectedKey`, `onSelectionChange`) are routed through
// `excludeFromArgs` rather than `argTypes` — they belong on the
// child components, not the root `<Breadcrumb>`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const typeOptions = ['text', 'text-line', 'button'] as const;
const dividerOptions = ['chevron', 'slash'] as const;

export const breadcrumbControls = {
  type: {
    type: 'inline-radio',
    options: typeOptions,
    default: 'text',
    description:
      'Visual treatment for items. `text` (default) is plain text crumbs, `text-line` adds an underline on hover (Apple-style), `button` renders each crumb as a pill / chip.',
    category: 'Style',
  } satisfies ControlSpec<(typeof typeOptions)[number]>,
  divider: {
    type: 'inline-radio',
    options: dividerOptions,
    default: 'chevron',
    description:
      'Glyph rendered between items. `chevron` (default) follows the kit / web convention; `slash` matches GitHub-style breadcrumbs and dense URLs.',
    category: 'Style',
  } satisfies ControlSpec<(typeof dividerOptions)[number]>,
  maxVisibleItems: {
    type: 'number',
    min: 2,
    max: 10,
    step: 1,
    default: 4,
    description:
      'Cap on items rendered before truncation kicks in. The middle of the path collapses behind a `…` ellipsis once the count exceeds this — first / last / current always remain visible. Tune for narrow surfaces.',
    category: 'Behavior',
  } satisfies ControlSpec<number>,
  children: {
    type: false,
    description:
      'Compose with `<Breadcrumb.Item href="…">…</Breadcrumb.Item>` for each segment. The kit auto-inserts dividers between items and renders the last item as the "current page" (no link styling).',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer `<nav aria-label="Breadcrumbs">` element.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

// `react-docgen-typescript` walks the static-property namespace
// (`Breadcrumb.Item`, `Breadcrumb.AccountItem`) and surfaces those
// sub-components' props on the merged root signature. Storybook's
// `ArgTypes<BreadcrumbsProps>` type only allows root props, so we
// can't add these to `argTypes`; surface them through the F6
// `excludeFromArgs` allowlist instead — consumers set them on
// `<Breadcrumb.Item …>`, not the root.
export const breadcrumbExcludeFromArgs = defineExcludeFromArgs([
  // BreadcrumbItem-only props.
  'href',
  'icon',
  'isEllipsis',
  'avatarSrc',
  'onClick',
  // BreadcrumbAccountItem-only props.
  'items',
  'selectedKey',
  'onSelectionChange',
] as const);
