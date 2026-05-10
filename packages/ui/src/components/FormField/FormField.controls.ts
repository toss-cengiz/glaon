import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md'] as const;

export const formFieldControls = {
  label: {
    type: 'text',
    default: 'Email',
    description:
      'Label rendered above the control. Bound to the control via `htmlFor` → `<input id>`.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  htmlFor: {
    type: 'text',
    default: 'email-input',
    description: '`id` of the control inside `children`. Required for the label↔control binding.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  hint: {
    type: 'text',
    description: 'Inline helper copy under the control. Suppressed when `error` is set.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  error: {
    type: 'text',
    description: 'Inline error message. Replaces `hint`; renders in the invalid state.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  isRequired: {
    type: 'boolean',
    default: false,
    description: 'Marks the field as required (visual asterisk on the label).',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description: 'Visual size — drives the `<HintText>` size.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
} as const;

export const formFieldExcludeFromArgs = defineExcludeFromArgs(['children'] as const);
