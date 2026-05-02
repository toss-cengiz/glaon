// `Button.controls.ts` — single source of truth for Button's variant
// matrix. Story (`Button.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Button.mdx`)
// reads the same spec via `<Controls />`.
//
// #307: Button gets the Phase 1.5 controls + MDX treatment so the
// controls panel surface matches Figma's `web-primitives-button`
// `Hierarchy` × `Size` × `Theme` × `Icon only` × `State` axes.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';

const sizeOptions = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const colorOptions = [
  'primary',
  'secondary',
  'tertiary',
  'primary-destructive',
  'secondary-destructive',
  'tertiary-destructive',
  'link-color',
  'link-gray',
  'link-destructive',
] as const;

export const buttonControls = {
  children: {
    type: 'text',
    default: 'Click me',
    description:
      'Button label. Leave empty (with `iconLeading` set) to render an icon-only button — the kit auto-detects this via the `data-icon-only` attribute and switches to square padding. Always pair an icon-only button with a meaningful `aria-label`.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'sm',
    description:
      'Visual scale. `xs` for dense table-row actions, `sm` (default) for forms, `md` for primary CTAs, `lg` / `xl` for hero / marketing buttons.',
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  color: {
    type: 'select',
    options: colorOptions,
    default: 'primary',
    description:
      "Hierarchy + theme combined. `primary` / `secondary` / `tertiary` are the three visual weights; suffix `-destructive` swaps the palette to error tokens; `link-color` / `link-gray` / `link-destructive` strip the surface chrome and render inline-link styling. Mirrors Figma's `Hierarchy` × `Theme` matrix.",
    category: 'Style',
  } satisfies ControlSpec<(typeof colorOptions)[number]>,
  iconLeading: {
    type: 'select',
    options: Object.keys(storybookIcons),
    mapping: storybookIcons,
    description:
      'Leading icon component. Pass alone (no `children`) to render an icon-only button — the kit applies square padding via `data-icon-only`. Pair an icon-only button with `aria-label`.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  iconTrailing: {
    type: 'select',
    options: Object.keys(storybookIcons),
    mapping: storybookIcons,
    description:
      "Trailing icon component (chevron-right, arrow-right, etc.). Common for 'Continue →' / 'Next' style CTAs.",
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  isDisabled: {
    type: 'boolean',
    default: false,
    description:
      'Block interaction and dim the button. Forwarded as `disabled` to the underlying RAC `<Button>` so axe and screen readers treat it as inert.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  isLoading: {
    type: 'boolean',
    default: false,
    description:
      'Show a spinner inside the button. The label is hidden by default (replaced by the spinner); set `showTextWhileLoading` to keep both visible. While loading the button blocks pointer events automatically.',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  showTextWhileLoading: {
    type: 'boolean',
    default: false,
    description:
      'Keep the label visible alongside the spinner during `isLoading`. Useful when the action is long-running and the user needs context ("Saving…").',
    category: 'Behavior',
  } satisfies ControlSpec<boolean>,
  noTextPadding: {
    type: 'boolean',
    default: false,
    description:
      'Strip horizontal text padding. Auto-applied for `link-*` colors (link variants are inline links, not chrome-bound buttons). Rarely useful otherwise.',
    category: 'Style',
  } satisfies ControlSpec<boolean>,
  href: {
    type: 'text',
    description:
      'Link destination. When set, the kit renders the button as an `<a>` (RAC `<Link>`) instead of a `<button>` element. Use for navigational CTAs that should be shareable / right-clickable.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  type: {
    type: 'inline-radio',
    options: ['button', 'submit', 'reset'] as const,
    description:
      'Native `<button type>` attribute. Defaults to `button` (no implicit form submission); set `submit` for the primary form button, `reset` for form-reset affordances. Ignored when `href` is set.',
    category: 'Behavior',
  } satisfies ControlSpec<'button' | 'submit' | 'reset'>,
  onClick: {
    type: false,
    action: 'clicked',
    description: 'Click handler. Fires on click + keyboard activation (Space / Enter).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer `<button>` / `<a>` element.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

// Props on the kit Button that flow through type-checking but have
// no useful Storybook control surface.
export const buttonExcludeFromArgs = defineExcludeFromArgs([
  // react-aria-components slot binding; only meaningful in `slots`-aware
  // composites, not as a Storybook knob.
  'slot',
  // Forwarded only when the link variant (`href`) is used; not a knob.
  'routerOptions',
] as const);
