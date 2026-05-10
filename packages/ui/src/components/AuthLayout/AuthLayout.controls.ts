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
} as const;

export const authLayoutExcludeFromArgs = defineExcludeFromArgs([
  'logoSlot',
  'imageSlot',
  'iconSlot',
  'footerSlot',
  'children',
] as const);
