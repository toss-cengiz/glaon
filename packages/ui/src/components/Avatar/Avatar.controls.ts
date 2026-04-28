// `Avatar.controls.ts` — single source of truth for Avatar's variant
// matrix. Story (`Avatar.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Avatar.mdx`)
// reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';

const sizeOptions = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
const statusOptions = ['online', 'offline'] as const;

export const avatarControls = {
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description:
      'Visual scale. `xs` for inline lists, `sm` for table rows, `md`–`lg` for cards, `xl`–`2xl` for profile headers.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  src: {
    type: 'text',
    description:
      'Image source URL. When omitted (or load fails) the component falls back to `initials` → `placeholderIcon` → `placeholder` → default user icon.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  alt: {
    type: 'text',
    default: 'Olivia Rhye',
    description:
      'Accessible name for the avatar image. Always describe who is being represented; meaningless alt text (e.g. "avatar") fails axe `image-alt`.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  initials: {
    type: 'text',
    default: 'OR',
    description:
      'Initials shown when no image is loaded. Two characters render best; the kit centres them inside the rounded surface.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  rounded: {
    type: 'boolean',
    default: true,
    description:
      'Render as a circle (`true`, default). Set to `false` for a rounded-square avatar (e.g. company logos).',
    category: 'Style',
  } satisfies ControlSpec<boolean>,
  border: {
    type: 'boolean',
    default: false,
    description:
      'Add an outer ring around the avatar — useful when avatars overlap or sit on busy backgrounds.',
    category: 'Style',
  } satisfies ControlSpec<boolean>,
  contrastBorder: {
    type: 'boolean',
    default: false,
    description: 'Add a thin inner contrast border around the image.',
    category: 'Style',
  } satisfies ControlSpec<boolean>,
  verified: {
    type: 'boolean',
    default: false,
    description: 'Show the verified-tick badge in the bottom-right corner.',
    category: 'Style',
  } satisfies ControlSpec<boolean>,
  focusable: {
    type: 'boolean',
    default: false,
    description:
      'Render a focus ring when the parent group is focused (e.g. inside a `<Link>` or `<Button>`). The Avatar itself is non-interactive.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  status: {
    type: 'inline-radio',
    options: statusOptions,
    description:
      'Status indicator pill in the bottom-right corner — `online` (green) or `offline` (grey). Mutually exclusive with `verified` and `count`.',
    category: 'Style',
  } satisfies ControlSpec<(typeof statusOptions)[number]>,
  count: {
    type: 'number',
    min: 0,
    max: 99,
    step: 1,
    description:
      'Numeric badge in the bottom-right corner (e.g. unread count). Mutually exclusive with `status` and `verified`.',
    category: 'Content',
  } satisfies ControlSpec<number>,
  placeholderIcon: {
    type: 'select',
    options: Object.keys(storybookIcons),
    mapping: storybookIcons,
    description:
      'Icon shown when there is no `src` and no `initials`. Defaults to the kit `User01` glyph.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  placeholder: {
    type: false,
    description:
      'Fully custom React node rendered when there is no `src` / `initials` / `placeholderIcon`. Last-resort fallback slot.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  badge: {
    type: false,
    description:
      'Custom corner badge slot (overrides `status` / `verified` / `count`). Use for company logos or other rich indicators.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer container.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  contentClassName: {
    type: false,
    description: 'Tailwind override hook for the inner image / initials wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

export const avatarExcludeFromArgs = defineExcludeFromArgs([] as const);
