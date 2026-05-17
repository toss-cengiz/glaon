// `SetupLayout.controls.ts` — single source of truth for SetupLayout's
// controllable props. Slot props (`logoSlot`, `footerSlot`, `children`)
// and the `steps` array (ReactNode-bearing objects) live in
// `excludeFromArgs` because they don't render meaningfully via the
// controls panel.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

export const setupLayoutControls = {
  activeStepId: {
    type: 'text',
    default: 'home-overview',
    description:
      'Id of the active step in `steps`. The matching row renders at full opacity; every other row renders at 50% opacity (`opacity-50` on the text block, icon stays full opacity).',
    category: 'Content',
  } satisfies ControlSpec<string>,
} as const;

export const setupLayoutExcludeFromArgs = defineExcludeFromArgs([
  'steps',
  'completedStepIds',
  'onSelectStep',
  'logoSlot',
  'footerSlot',
  'children',
] as const);
