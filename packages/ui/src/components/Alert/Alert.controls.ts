// `Alert.controls.ts` — single source of truth for Alert's variant
// matrix. Story (`Alert.stories.tsx`) imports the spec and spreads
// it into `meta.args` / `meta.argTypes`; MDX docs (`Alert.mdx`)
// reads the same spec via `<Controls />`.
//
// #303: Alert is now a parametric wrap over the kit's `AlertFloating`
// + `AlertFullWidth`. Controls match the Figma `web-primitives-alert`
// `Color` × `Size` axes 1:1 — `intent` (legacy 4 values) was renamed
// to `color` (6 values) to match the kit and Figma.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';

const colorOptions = ['default', 'brand', 'gray', 'error', 'warning', 'success'] as const;
const sizeOptions = ['floating', 'full-width'] as const;
const actionTypeOptions = ['button', 'link'] as const;

export const alertControls = {
  title: {
    type: 'text',
    default: 'New feature available',
    description:
      'Bold lead-in line. Keep it short — the FeaturedIcon renders to the left and the close X to the right; long titles wrap or truncate on narrow viewports.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  description: {
    type: 'text',
    default: 'Check out the new dashboard.',
    description:
      'Optional secondary copy under the title. Use for one-line elaboration; for multi-paragraph content prefer Banner.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  color: {
    type: 'select',
    options: colorOptions,
    default: 'default',
    description:
      "Severity / surface palette. Mirrors Figma's `Color` axis 1:1 — `default` (neutral), `brand` (promo / informational), `gray` (subtle), `error` / `warning` / `success` for status meaning.",
    category: 'Style',
  } satisfies ControlSpec<(typeof colorOptions)[number]>,
  size: {
    type: 'inline-radio',
    options: sizeOptions,
    default: 'floating',
    description:
      "Layout variant. `floating` is a card-style alert (modal-friendly, dashboard surface); `full-width` is an inline page-wide bar (system status pinned to a page top). Mirrors Figma's `Size` axis.",
    category: 'Style',
  } satisfies ControlSpec<(typeof sizeOptions)[number]>,
  actionType: {
    type: 'inline-radio',
    options: actionTypeOptions,
    default: 'button',
    description:
      "Action button styling for `size='full-width'` only. `button` renders filled / secondary buttons; `link` renders inline link styling. Ignored when `size='floating'` — the kit always uses link styling there.",
    category: 'Style',
  } satisfies ControlSpec<(typeof actionTypeOptions)[number]>,
  confirmLabel: {
    type: 'text',
    description:
      'Label for the primary CTA (right side). Pair with `onConfirm`. Leave both undefined to render an alert without an action button.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  onConfirm: {
    type: false,
    action: 'confirmed',
    description: 'Click handler for the primary CTA.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  dismissLabel: {
    type: 'text',
    default: 'Dismiss',
    description:
      'Label for the dismiss button. Also serves as the `aria-label` for the close X. Defaults to `Dismiss`; localise per app locale.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  onDismiss: {
    type: false,
    action: 'dismissed',
    description:
      'Click handler for the dismiss button + close X. Setting this also surfaces the close X in the corner; leaving it undefined renders the alert as persistent.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
} as const;

export const alertExcludeFromArgs = defineExcludeFromArgs([] as const);
