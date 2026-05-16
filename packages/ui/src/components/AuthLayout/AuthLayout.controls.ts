// `AuthLayout.controls.ts` — single source of truth for AuthLayout's
// variant matrix. Story imports the spec; MDX docs reads the same
// spec via `<Controls />`. Slot props (`logoSlot`, `imageSlot`,
// `iconSlot`, `footerSlot`, `children`) live in `excludeFromArgs`
// because they're ReactNode and don't render meaningfully through
// the controls panel.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const variantOptions = ['split', 'centered'] as const;

export const authLayoutControls = {
  variant: {
    type: 'inline-radio',
    options: variantOptions,
    default: 'split',
    description:
      'Layout variant. `split` is the Login + Sign-up frame (left-side card + right-side hero image, collapses to a single column under `lg`). `centered` is the Forgot password + Email verification frame (single card with optional icon slot above the title).',
    category: 'Style',
  } satisfies ControlSpec<(typeof variantOptions)[number]>,
  title: {
    type: 'text',
    default: '',
    description:
      'Page title rendered as `<h1 className="text-display-xs font-semibold">` inside a shared `flex flex-col gap-3` header. Leave empty to skip the header (e.g. when the screen renders its own custom heading via `children`).',
    category: 'Content',
  } satisfies ControlSpec<string>,
  subtitle: {
    type: 'text',
    default: '',
    description:
      'Supporting text rendered under `title` as `<p className="text-md text-tertiary">`. Ignored when `title` is empty.',
    category: 'Content',
  } satisfies ControlSpec<string>,
} as const;

export const authLayoutExcludeFromArgs = defineExcludeFromArgs([
  'logoSlot',
  'imageSlot',
  'iconSlot',
  'footerSlot',
  'children',
] as const);
