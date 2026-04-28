// `Banner.controls.ts` — single source of truth for Banner's variant
// matrix. Story (`Banner.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Banner.mdx`)
// reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';

const intentOptions = ['info', 'success', 'warning', 'danger'] as const;

export const bannerControls = {
  title: {
    type: 'text',
    default: 'We use cookies',
    description:
      'Bold lead-in line of the announcement. Keep it concise; the description carries the supporting copy.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  description: {
    type: 'text',
    default: 'See our cookie policy for details.',
    description:
      'Optional secondary line. For multi-paragraph content prefer a Modal or a dedicated page.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  intent: {
    type: 'inline-radio',
    options: intentOptions,
    default: 'info',
    description:
      'Severity / colour group for the leading icon. `info` for general announcements (default), `warning` for time-sensitive issues, `success` for global confirmations, `danger` for outage / failure banners.',
    category: 'Style',
  } satisfies ControlSpec<(typeof intentOptions)[number]>,
  dismissible: {
    type: 'boolean',
    default: false,
    description:
      'Render the close button at the top-right corner. Pair with `onDismiss` to persist the dismissed state across sessions.',
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
  actions: {
    type: false,
    description:
      'Action slot — typically one or two `<Button>` elements rendered to the right of the message. Renders below the text on mobile, beside it on desktop.',
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

export const bannerExcludeFromArgs = defineExcludeFromArgs([] as const);
