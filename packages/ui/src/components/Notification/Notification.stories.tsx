import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Notification, type NotificationType } from './Notification';
import { notificationControls, notificationExcludeFromArgs } from './Notification.controls';

const { args, argTypes } = defineControls(notificationControls);

// Explicit `Meta<typeof Notification>` annotation (rather than
// `satisfies`) keeps the unexported `NotificationProps` interface
// out of the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true` and TS4023 fires when an exported `meta`
// resolves to a non-exported nominal type.
const meta: Meta<typeof Notification> = {
  title: 'Web Primitives/Notification',
  component: Notification,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-notification',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Notification>;

export const excludeFromArgs = notificationExcludeFromArgs;

export const Default: Story = {
  args: { timestamp: '2 min ago' },
};

export const GrayIcon: Story = {
  args: {
    type: 'gray-icon',
    title: 'Repository archived',
    description: 'glaon-experiments was moved to the archive list.',
    timestamp: '5 min ago',
  },
};

export const Success: Story = {
  args: {
    type: 'success-icon',
    title: 'Successfully updated profile',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    timestamp: 'Just now',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning-icon',
    title: 'Token rotation in 24 hours',
    description: 'Re-authenticate before midnight to avoid disruption.',
    primaryActionLabel: 'Re-authenticate',
    onPrimaryAction: () => undefined,
  },
};

export const Error: Story = {
  args: {
    type: 'error-icon',
    title: 'Failed to publish changes',
    description: 'Network error — please try again.',
    primaryActionLabel: 'Retry',
    onPrimaryAction: () => undefined,
  },
};

export const NoIcon: Story = {
  args: {
    type: 'no-icon',
    title: 'You signed in from a new device',
    description: 'Mac · Chrome · Istanbul · 2 minutes ago',
  },
};

export const WithAvatar: Story = {
  args: {
    type: 'avatar',
    avatarSrc: 'https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80',
    avatarAlt: 'Olivia Rhye',
    title: 'Olivia commented on your file',
    description: '"Looks great — let’s ship it 🚀"',
    timestamp: '2 min ago',
    primaryActionLabel: 'Reply',
    onPrimaryAction: () => undefined,
    onDismiss: () => undefined,
  },
};

export const WithImage: Story = {
  args: {
    type: 'image',
    imageSrc: 'https://www.untitledui.com/images/cards/photography-1.jpg',
    imageAlt: 'Cover photo',
    title: 'Photography weekly',
    description: 'Issue 24 is out — featuring 8 community submissions.',
    timestamp: '1 hour ago',
    primaryActionLabel: 'Read',
    onPrimaryAction: () => undefined,
  },
};

export const ProgressIndicator: Story = {
  args: {
    type: 'progress-indicator',
    title: 'Uploading resume.pdf',
    progress: 65,
    progressLabel: '12.5 MB / 19.2 MB',
    secondaryActionLabel: 'Cancel',
    onSecondaryAction: () => undefined,
  },
};

export const Dismissible: Story = {
  args: {
    title: 'Settings synced across devices',
    description: 'All preferences are now identical on every signed-in client.',
    onDismiss: () => undefined,
  },
};

export const ActionsRow: Story = {
  args: {
    type: 'primary-icon',
    title: 'Update available',
    description: 'A newer version is ready to install.',
    primaryActionLabel: 'Install',
    onPrimaryAction: () => undefined,
    secondaryActionLabel: 'Later',
    onSecondaryAction: () => undefined,
  },
};

// Matrix story: iterates `type` and renders every leading-visual
// variant in one canvas. The controls panel hides slot props that
// are baked in per row.
const TYPES: NotificationType[] = [
  'primary-icon',
  'gray-icon',
  'success-icon',
  'warning-icon',
  'error-icon',
  'no-icon',
  'progress-indicator',
  'avatar',
  'image',
];

export const Types: Story = {
  parameters: {
    controls: {
      exclude: ['type', 'avatarSrc', 'imageSrc', 'progress', 'progressLabel'],
    },
  },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {TYPES.map((type) => (
        <Notification
          key={type}
          {...args}
          type={type}
          title={`Type: ${type}`}
          avatarSrc={
            type === 'avatar'
              ? 'https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80'
              : undefined
          }
          avatarAlt={type === 'avatar' ? 'Olivia Rhye' : undefined}
          imageSrc={
            type === 'image'
              ? 'https://www.untitledui.com/images/cards/photography-1.jpg'
              : undefined
          }
          imageAlt={type === 'image' ? 'Cover photo' : undefined}
          progress={type === 'progress-indicator' ? 65 : undefined}
          progressLabel={type === 'progress-indicator' ? '12.5 MB / 19.2 MB' : undefined}
        />
      ))}
    </div>
  ),
};
