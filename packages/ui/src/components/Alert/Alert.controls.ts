// `Alert.controls.ts` — single source of truth for Alert's variant
// matrix. Story (`Alert.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Alert.mdx`)
// reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';

const intentOptions = ['info', 'success', 'warning', 'danger'] as const;

export const alertControls = {
  title: {
    type: 'text',
    default: 'New feature available',
    description:
      'Bold lead-in line. Keep it short — full-stop is optional. The intent icon renders inline next to it.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  description: {
    type: 'text',
    default: 'Check out the new dashboard.',
    description:
      'Optional secondary copy under the title. Use for one-line elaboration; for multi-paragraph content prefer Banner.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  intent: {
    type: 'inline-radio',
    options: intentOptions,
    default: 'info',
    description:
      'Severity / colour group for the leading icon. `info` for neutral hints, `success` for confirmations, `warning` for time-sensitive prompts, `danger` for errors.',
    category: 'Style',
  } satisfies ControlSpec<(typeof intentOptions)[number]>,
  dismissible: {
    type: 'boolean',
    default: false,
    description:
      'Render the close button at the top-right corner. Pair with `onDismiss` to handle the click.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  dismissLabel: {
    type: 'text',
    default: 'Dismiss',
    description:
      'Accessible name for the close button. Defaults to "Dismiss"; localise per app locale.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  icon: {
    type: 'select',
    options: Object.keys(storybookIcons),
    mapping: storybookIcons,
    description:
      'Override the default icon for the chosen intent. Pass any component from `@untitledui/icons` (or a custom React component with the same shape).',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  onDismiss: {
    type: false,
    action: 'dismissed',
    description: 'Fires when the close button is clicked.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer container.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

export const alertExcludeFromArgs = defineExcludeFromArgs([] as const);
