// `Card.controls.ts` — single source of truth for Card's variant
// matrix. Story (`Card.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Card.mdx`)
// reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const variantOptions = ['default', 'elevated', 'muted'] as const;

export const cardControls = {
  variant: {
    type: 'inline-radio',
    options: variantOptions,
    default: 'default',
    description:
      'Visual style. `default` for standard surfaces, `elevated` for emphasis (heavier shadow), `muted` for nested or secondary content (tinted background).',
    category: 'Style',
  } satisfies ControlSpec<(typeof variantOptions)[number]>,
  interactive: {
    type: 'boolean',
    default: false,
    description:
      'Promote the card to a clickable surface. Wraps the content in a react-aria-components `<Button>` so keyboard activation, focus ring, and `role="button"` come for free. Pair with `onPress`.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  onPress: {
    type: false,
    action: 'pressed',
    description:
      'Fires when an interactive card is activated (click, Enter, Space). Ignored unless `interactive` is true.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  children: {
    type: false,
    description:
      'Card content. Compose with `Card.Header`, `Card.Body`, and `Card.Footer` slot components for clean section dividers.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer container.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

export const cardExcludeFromArgs = defineExcludeFromArgs([] as const);
