// `Banner.controls.ts` — single source of truth for Banner's variant
// matrix. Story (`Banner.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Banner.mdx`)
// reads the same spec via `<Controls />`.
//
// #305: Banner is now a parametric primitive matching Figma's
// `web-primitives-banner` `Type` × `Theme` axes 1:1.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';

const typeOptions = ['text-field', 'single-action', 'dual-action', 'slim'] as const;
const themeOptions = ['default', 'brand'] as const;
const inputTypeOptions = ['email', 'text', 'url', 'tel'] as const;

export const bannerControls = {
  type: {
    type: 'inline-radio',
    options: typeOptions,
    default: 'single-action',
    description:
      "Layout discriminator. Mirrors Figma's `Type` axis 1:1 — `text-field` adds an inline email input + submit button; `single-action` exposes one CTA; `dual-action` exposes two CTAs (e.g. cookie banner Decline / Allow); `slim` is a 48px-tall center-aligned strip with title + inline link only.",
    category: 'Style',
  } satisfies ControlSpec<(typeof typeOptions)[number]>,
  theme: {
    type: 'inline-radio',
    options: themeOptions,
    default: 'default',
    description:
      "Surface palette. `default` (light tray with ring) for in-flow content; `brand` (dark navy fill) for promotional / hero banners that need to pop. Mirrors Figma's `Theme` axis.",
    category: 'Style',
  } satisfies ControlSpec<(typeof themeOptions)[number]>,
  title: {
    type: 'text',
    default: 'Stay up to date with the latest news and updates',
    description: 'Bold first line. Always set. Long titles truncate on desktop and wrap on mobile.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  description: {
    type: 'text',
    default: 'Be the first to hear about new components, updates, and design resources.',
    description:
      "Optional secondary copy. Pass a `ReactNode` to embed inline links (e.g. `Read our <a>Cookie Policy</a>`). Ignored for `type='slim'` — slim renders title + inline link inside `title`.",
    category: 'Content',
  } satisfies ControlSpec<string>,
  icon: {
    type: 'select',
    options: Object.keys(storybookIcons),
    mapping: storybookIcons,
    description:
      "Override the leading icon. Defaults to the kit `CheckVerified02` glyph. Ignored for `type='slim'` — slim has no icon.",
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  primaryActionLabel: {
    type: 'text',
    description:
      'Label for the primary CTA (right side). Common values: `Subscribe`, `Read update`, `Allow`. Pair with `onPrimaryAction`. Empty / whitespace strings auto-hide the button.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  onPrimaryAction: {
    type: false,
    action: 'primary-action-clicked',
    description: 'Click handler for the primary CTA.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  secondaryActionLabel: {
    type: 'text',
    description:
      "Label for the secondary CTA (left of the primary). Only renders when `type='dual-action'`. Common values: `Decline`, `Skip`.",
    category: 'Content',
  } satisfies ControlSpec<string>,
  onSecondaryAction: {
    type: false,
    action: 'secondary-action-clicked',
    description: 'Click handler for the secondary CTA.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  inputPlaceholder: {
    type: 'text',
    default: 'Enter your email',
    description: "Placeholder for the input. Only used when `type='text-field'`.",
    category: 'Content',
  } satisfies ControlSpec<string>,
  inputType: {
    type: 'inline-radio',
    options: inputTypeOptions,
    default: 'email',
    description:
      'Native input type — drives the mobile keyboard hint. `email` (default) for newsletter signup, `text` for free-form, `url` / `tel` for specialised flows.',
    category: 'Behavior',
  } satisfies ControlSpec<(typeof inputTypeOptions)[number]>,
  inputAriaLabel: {
    type: 'text',
    default: 'Email',
    description:
      'Accessible label for the input (forwarded as `aria-label`). Required when no visible label exists in the surrounding UI.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  inputValue: {
    type: 'text',
    description: 'Controlled input value. Pair with `onInputChange` to manage state outside.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  defaultInputValue: {
    type: 'text',
    description: 'Initial input value for uncontrolled usage.',
    category: 'Behavior',
  } satisfies ControlSpec<string>,
  onInputChange: {
    type: false,
    action: 'input-changed',
    description: 'Fires on every keystroke with the new string value.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onDismiss: {
    type: false,
    action: 'dismissed',
    description:
      'Click handler for the close X. Setting this surfaces the close button; leaving it undefined renders the banner as persistent.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  dismissLabel: {
    type: 'text',
    default: 'Dismiss',
    description:
      'Accessible label for the close X (forwarded as `aria-label`). Defaults to `Dismiss`; localise per app locale.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer container.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

export const bannerExcludeFromArgs = defineExcludeFromArgs([] as const);
