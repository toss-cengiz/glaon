import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const iconLeadingOptions = ['arrow-left'] as const;

export const authFooterControls = {
  prompt: {
    type: 'text',
    default: "Don't have an account?",
    description: 'Lead-in text rendered before the link. Leave empty for the back-link variant.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  linkText: {
    type: 'text',
    default: 'Sign up',
    description: 'Link label (the clickable part).',
    category: 'Content',
  } satisfies ControlSpec<string>,
  linkHref: {
    type: 'text',
    default: '/sign-up',
    description: 'Destination URL for the link.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  iconLeading: {
    type: 'inline-radio',
    options: iconLeadingOptions,
    description:
      'Optional leading icon. `arrow-left` is the convention for the "Back to log in" prompt.',
    category: 'Style',
  } satisfies ControlSpec<(typeof iconLeadingOptions)[number]>,
  onLinkClick: {
    type: false,
    action: 'linkClicked',
    description: 'Click handler — useful for SPA routers that want to preventDefault.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
} as const;

export const authFooterExcludeFromArgs = defineExcludeFromArgs(['promptNode'] as const);
