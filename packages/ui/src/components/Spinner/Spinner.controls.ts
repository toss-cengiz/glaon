// `Spinner.controls.ts` — single source of truth for Spinner's variant
// matrix. Story (`Spinner.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Spinner.mdx`)
// reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const typeOptions = ['line-simple', 'line-spinner', 'dot-circle'] as const;
const sizeOptions = ['sm', 'md', 'lg', 'xl'] as const;

export const spinnerControls = {
  type: {
    type: 'inline-radio',
    options: typeOptions,
    default: 'line-simple',
    description:
      'Visual style. `line-simple` is a thin partial circle (default for inline indicators); `line-spinner` is a filled brand arc (used inside Buttons via `isLoading`); `dot-circle` is a gradient-stroke dotted ring (richer empty-state pattern).',
    category: 'Style',
  } satisfies ControlSpec<(typeof typeOptions)[number]>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'sm',
    description:
      'Visual scale. `sm` for inline buttons / inputs; `md` / `lg` for section-level loading; `xl` for full-page suspense fallbacks.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  label: {
    type: 'text',
    default: '',
    description:
      'Optional caption rendered below the spinner. When present provides an accessible name for the busy region; when empty the parent must label the loading state via `aria-label`.',
    category: 'Content',
  } satisfies ControlSpec<string>,
} as const;

export const spinnerExcludeFromArgs = defineExcludeFromArgs([] as const);
