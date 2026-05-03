// `Textarea.controls.ts` — single source of truth for Textarea's
// variant matrix. Story (`Textarea.stories.tsx`) imports the spec and
// spreads it into `meta.args` / `meta.argTypes`; MDX docs
// (`Textarea.mdx`) reads the same spec via `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const sizeOptions = ['sm', 'md'] as const;
const variantOptions = ['default', 'tags-inner'] as const;
type TagSeparator = 'Enter' | ',' | ' ';

export const textareaControls = {
  variant: {
    type: 'inline-radio',
    options: variantOptions,
    default: 'default',
    description:
      'Layout. `default` renders the kit textarea verbatim. `tags-inner` splits the surface into a chip list + typing area for multi-value capture (mail recipients, tag clouds). Tags-only props (`tags`, `defaultTags`, `onTagsChange`, `addTagOn`) are ignored when `variant` stays `default`.',
    category: 'Style',
  } satisfies ControlSpec<(typeof variantOptions)[number]>,
  label: {
    type: 'text',
    default: 'Description',
    description:
      'Visible label rendered above the field. Always provide one — labels satisfy axe `label` and pair the field with assistive tech automatically. Use `aria-label` only when a visible label would clutter the layout (e.g. inline note widgets).',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  placeholder: {
    type: 'text',
    default: 'Tell us a bit about yourself…',
    description:
      'Hint text shown when the field is empty. Never use placeholder as a substitute for a label — it disappears on focus and fails axe `placeholder-only`.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  hint: {
    type: 'text',
    description:
      'Helper text rendered below the field. Doubles as the error message when `isInvalid` is true (the kit re-styles it red and adds `aria-describedby`).',
    category: 'Content',
  } satisfies ControlSpec<string>,
  tooltip: {
    type: 'text',
    description:
      'Inline tooltip trigger appended to the label (info icon). Use for short clarifying copy when `hint` would crowd the field.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'md',
    description:
      'Visual scale. `sm` for compact comment composers, `md` (default) for forms and long-form notes.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  rows: {
    type: 'number',
    min: 1,
    max: 20,
    step: 1,
    default: 4,
    description:
      'Native `<textarea rows>` — sets the initial visible height. Users can still drag the resize handle past this height.',
    category: 'Style',
  } satisfies ControlSpec<number>,
  cols: {
    type: 'number',
    min: 10,
    max: 100,
    step: 5,
    description:
      'Native `<textarea cols>` — sets the initial visible width. Prefer driving width via the parent container; only set `cols` when you need a hard character-grid sizing.',
    category: 'Style',
  } satisfies ControlSpec<number>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Block all interaction and dim the field. The native `disabled` attribute is forwarded so axe and assistive tech treat the field as inert.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isReadOnly: {
    type: 'boolean',
    default: false,
    description:
      'Field is selectable + copyable but the value cannot be edited. Prefer over `isDisabled` when the value should remain accessible to screen readers and copy/paste.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isRequired: {
    type: 'boolean',
    default: false,
    description:
      'Mark the field as required (renders an indicator next to the label and forwards `aria-required`). Use `hideRequiredIndicator` to drop the visual marker on dense forms while keeping the a11y semantics.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  isInvalid: {
    type: 'boolean',
    default: false,
    description:
      'Surface validation error styling (red border + ring). Pair with a `hint` to describe the error; the kit wires `aria-invalid` + `aria-describedby` automatically.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  hideRequiredIndicator: {
    type: 'boolean',
    default: false,
    description:
      'Hide the visual `*` next to the label even when `isRequired` is true. Keep `isRequired` set so the a11y contract still reports the field as required.',
    category: 'A11y',
  } satisfies ControlSpec<boolean>,
  value: {
    type: 'text',
    description:
      'Controlled value. Pair with `onChange` to manage state outside the field. Leave undefined for uncontrolled usage with `defaultValue`.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  defaultValue: {
    type: 'text',
    description:
      'Initial value for uncontrolled usage. The kit forwards this to the native `<textarea defaultValue>`.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  name: {
    type: 'text',
    description:
      'Form field name forwarded to the native textarea — required for native form submission.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  onChange: {
    type: false,
    action: 'changed',
    description:
      'Fires on every keystroke with the new string value (RAC TextField onChange contract).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onBlur: {
    type: false,
    action: 'blurred',
    description: 'Fires when focus leaves the field — typical place to run validation.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onFocus: {
    type: false,
    action: 'focused',
    description: 'Fires when focus enters the field.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer wrapper.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  textAreaClassName: {
    type: false,
    description: 'Tailwind override hook for the native `<textarea>` element itself.',
    category: 'Style',
  } satisfies ControlSpec<string>,
  tags: {
    type: 'object',
    description:
      "Controlled chip list (`variant='tags-inner'`). Pair with `onTagsChange` to manage state outside the field.",
    category: 'Behavior',
  } satisfies ControlSpec<string[]>,
  defaultTags: {
    type: 'object',
    description:
      'Initial chip list for uncontrolled `tags-inner` usage. Storybook\'s `object` control accepts a JSON array (`["alice@example.com", "bob@example.com"]`).',
    category: 'Behavior',
  } satisfies ControlSpec<string[]>,
  onTagsChange: {
    type: false,
    action: 'tags-changed',
    description:
      'Fires with the next chip list when chips are added (Enter / comma / paste) or removed (Backspace / X). Required for controlled `tags` usage.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  addTagOn: {
    type: 'object',
    default: ['Enter', ','] satisfies TagSeparator[],
    description:
      "Keys that confirm the current text into a chip. Defaults to `['Enter', ',']`. Add `' '` for whitespace-as-separator (tag clouds), drop `,` to allow commas inside a single tag (rare). Storybook's `object` control accepts a JSON array.",
    category: 'Behavior',
  } satisfies ControlSpec<TagSeparator[]>,
  ref: {
    type: false,
    description: 'Forwarded ref to the kit `<TextField>` wrapper.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  textAreaRef: {
    type: false,
    description: 'Forwarded ref to the underlying `<textarea>` element.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
} as const;

// react-aria-components forwards a number of props from RAC TextField
// that we don't surface as Storybook controls; the F6 prop-coverage
// gate accepts them via this allowlist instead.
export const textareaExcludeFromArgs = defineExcludeFromArgs([
  'autoFocus',
  'validate',
  'validationBehavior',
  'inputMode',
  'minLength',
  'maxLength',
  'pattern',
  'autoComplete',
  'enterKeyHint',
  'spellCheck',
  'autoCorrect',
  'autoCapitalize',
  'form',
  'translate',
  'slot',
  'children',
  'type',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'data-rac',
] as const);
