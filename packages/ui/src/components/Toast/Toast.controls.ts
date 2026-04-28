// `Toast.controls.ts` — single source of truth for Toast's variant
// matrix. Story (`Toast.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Toast.mdx`)
// reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const intentOptions = ['info', 'success', 'warning', 'danger'] as const;

export const toastControls = {
  title: {
    type: 'text',
    default: 'Saved successfully',
    description:
      'Bold first line of the toast. Keep it short and scannable — toasts are read in motion. Match the verb tense to the outcome ("Saved", "Could not save").',
    category: 'Content',
  } satisfies ControlSpec<string>,
  description: {
    type: 'text',
    default: 'Your changes are live across the workspace.',
    description:
      'Optional secondary line under the title. Use sparingly — long descriptions push the action button below the fold and slow down the read.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  intent: {
    type: 'inline-radio',
    options: intentOptions,
    default: 'info',
    description:
      'Severity / colour group for the leading icon. `info` (default) for neutral updates, `success` for confirmation, `warning` for soft alerts, `danger` for failures.',
    category: 'Style',
  } satisfies ControlSpec<(typeof intentOptions)[number]>,
  duration: {
    type: 'number',
    min: 0,
    max: 30000,
    step: 500,
    default: 0,
    description:
      'Auto-dismiss delay in ms. `0` (story default) keeps the toast visible until the user dismisses it — handy for screenshot capture. Production callers usually pass `4000`–`6000`.',
    category: 'Behavior',
  } satisfies ControlSpec<number>,
  hideClose: {
    type: 'boolean',
    default: false,
    description:
      'Hide the dismiss `×` button. Use only when an action button (`action.label`) is the sole dismissal path — never on a persistent toast (`duration: 0`).',
    category: 'Style',
  } satisfies ControlSpec<boolean>,
  action: {
    type: 'object',
    description:
      'Optional CTA shape `{ label: string, onPress: () => void }`. Renders a button under the description; the toast auto-dismisses after `onPress` fires.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onDismiss: {
    type: false,
    action: 'dismissed',
    description: 'Fires when the toast is dismissed (auto, via action, or via the close button).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
} as const;

export const toastExcludeFromArgs = defineExcludeFromArgs([] as const);
