// `Breadcrumb.native.controls.ts` — RN-side variant matrix. Native pattern is "back +
// title", so the prop surface is intentionally narrow vs. the web Breadcrumb wrap (which
// owns kit-driven `type` / `divider` / `maxVisibleItems`). Story
// (`Breadcrumb.native.stories.tsx`) imports this spec and spreads it into
// `meta.args` / `meta.argTypes`.

import type { ControlSpec } from '../_internal/controls';

export const breadcrumbNativeControls = {
  title: {
    type: 'text',
    default: 'Living room',
    description:
      'Current screen title. Equivalent to the last `<Breadcrumb.Item>` on the web wrap.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  subtitle: {
    type: 'text',
    default: '',
    description:
      'Optional second line, typically the parent screen name on iOS-style large headers.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  backLabel: {
    type: 'text',
    default: 'Back',
    description:
      'Accessibility label for the back button. Localize per locale catalog (i18n-B / #424).',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  onBack: {
    type: false,
    description:
      'Tap callback for the back affordance. Omit on root screens — the button hides and only the title renders.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
} as const;
