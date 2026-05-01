// `Notification.controls.ts` — single source of truth for
// Notification's variant matrix. Story (`Notification.stories.tsx`)
// imports the spec and spreads it into `meta.args` / `meta.argTypes`;
// MDX docs (`Notification.mdx`) reads the same spec via
// `<Controls />`.

import type { ControlSpec } from '../_internal/controls';
import { excludeFromArgs as defineExcludeFromArgs } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';

const typeOptions = [
  'primary-icon',
  'gray-icon',
  'success-icon',
  'warning-icon',
  'error-icon',
  'no-icon',
  'progress-indicator',
  'avatar',
  'image',
] as const;

export const notificationControls = {
  type: {
    type: 'select',
    options: typeOptions,
    default: 'primary-icon',
    description:
      "Leading-visual discriminator. Mirrors Figma's `Type` axis 1:1 — `*-icon` variants render a FeaturedIcon (color-coded), `no-icon` skips the leading slot, `progress-indicator` shows a horizontal progress bar inside the body, `avatar` embeds an Avatar instance, `image` embeds a 40px square thumbnail.",
    category: 'Style',
  } satisfies ControlSpec<(typeof typeOptions)[number]>,
  title: {
    type: 'text',
    default: "We're just released a new feature",
    description:
      'Bold first line of the notification. Keep it short — long titles wrap inside the body and push timestamps to the next line.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  description: {
    type: 'text',
    default: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    description:
      'Optional secondary line below the title. Use for context (commit message excerpt, file name, change summary).',
    category: 'Content',
  } satisfies ControlSpec<string>,
  timestamp: {
    type: 'text',
    description:
      'Inline subtle text rendered next to the title (e.g. "2 min ago", "Just now"). Decorative — pair with an absolute date in `description` for accessibility when the relative timestamp is the only datestamp.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  icon: {
    type: 'select',
    options: Object.keys(storybookIcons),
    mapping: storybookIcons,
    description:
      'Override the default glyph for `*-icon` types. Defaults: `info` for primary/gray, `check` for success, `triangle` for warning, `circle` for error.',
    category: 'Content',
  } satisfies ControlSpec<unknown>,
  avatarSrc: {
    type: 'text',
    description:
      'Image URL for `type="avatar"`. Pair with `avatarAlt` for the accessible name; if both `src` and `initials` are missing, the Avatar renders the default user glyph.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  avatarAlt: {
    type: 'text',
    description: 'Accessible name for the Avatar image (e.g. "Olivia Rhye").',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  avatarInitials: {
    type: 'text',
    description: 'Two-character fallback initials when no `avatarSrc` is set (e.g. "OR").',
    category: 'Content',
  } satisfies ControlSpec<string>,
  imageSrc: {
    type: 'text',
    description: 'Image URL for `type="image"`. Renders as a 40px rounded square.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  imageAlt: {
    type: 'text',
    description:
      'Accessible name for the image. Always describe the content; meaningless alts fail axe.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  progress: {
    type: 'number',
    min: 0,
    max: 100,
    step: 1,
    description: 'Progress value (0..100) for `type="progress-indicator"`. Drives the bar fill.',
    category: 'Content',
  } satisfies ControlSpec<number>,
  progressLabel: {
    type: 'text',
    description: 'Optional caption next to the progress bar (e.g. "12.5 MB / 50 MB").',
    category: 'Content',
  } satisfies ControlSpec<string>,
  primaryActionLabel: {
    type: 'text',
    description:
      'Label for the primary action button (right side). Pair with `onPrimaryAction`. Common values: `Reply`, `View changes`, `Approve`, `Install`.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  onPrimaryAction: {
    type: false,
    action: 'primary-action-clicked',
    description: 'Click handler for the primary action button.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  secondaryActionLabel: {
    type: 'text',
    description:
      'Label for the secondary action button (left of the primary). Common values: `Dismiss`, `Decline`, `Skip`.',
    category: 'Content',
  } satisfies ControlSpec<string>,
  onSecondaryAction: {
    type: false,
    action: 'secondary-action-clicked',
    description: 'Click handler for the secondary action button.',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  onDismiss: {
    type: false,
    action: 'dismissed',
    description:
      'Click handler for the close X button. Setting this surfaces the close X in the corner; leaving it undefined renders the notification as persistent (footer actions are the only dismissal path).',
    category: 'Behavior',
  } satisfies ControlSpec<unknown>,
  dismissLabel: {
    type: 'text',
    default: 'Dismiss',
    description:
      'Accessible label for the close X button. Forwarded as `aria-label`. Defaults to `Dismiss`; localise per app locale.',
    category: 'A11y',
  } satisfies ControlSpec<string>,
  className: {
    type: false,
    description: 'Tailwind override hook for the outer container.',
    category: 'Style',
  } satisfies ControlSpec<string>,
} as const;

export const notificationExcludeFromArgs = defineExcludeFromArgs([] as const);
