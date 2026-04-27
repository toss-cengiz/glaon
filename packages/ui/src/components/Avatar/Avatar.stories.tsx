import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { storybookIcons } from '../../icons/storybook';
import { Avatar } from './Avatar';

// Explicit `Meta<typeof Avatar>` annotation (rather than `satisfies`)
// keeps the kit's unexported `AvatarProps` shape out of the exported
// `meta` signature — `tsc --noEmit` runs with `declaration: true` and
// trips TS4023 / TS2742 when the inferred meta references types that
// aren't portably named.
const meta: Meta<typeof Avatar> = {
  title: 'Web Primitives/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-avatar',
    },
  },
  args: {
    size: 'md',
    alt: 'Olivia Rhye',
    initials: 'OR',
    rounded: true,
    border: false,
    contrastBorder: false,
    verified: false,
    focusable: false,
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
    },
    src: { control: 'text' },
    alt: { control: 'text' },
    initials: { control: 'text' },
    rounded: { control: 'boolean' },
    border: { control: 'boolean' },
    contrastBorder: { control: 'boolean' },
    verified: { control: 'boolean' },
    focusable: { control: 'boolean' },
    status: {
      control: 'inline-radio',
      options: ['online', 'offline', undefined],
    },
    count: { control: { type: 'number', min: 0, max: 99, step: 1 } },
    placeholderIcon: {
      control: 'select',
      options: Object.keys(storybookIcons),
      mapping: storybookIcons,
    },
    placeholder: { control: false, table: { disable: true } },
    badge: { control: false, table: { disable: true } },
    className: { control: false, table: { disable: true } },
    contentClassName: { control: false, table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {};

export const WithImage: Story = {
  args: {
    src: 'https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80',
    alt: 'Olivia Rhye',
  },
};

export const WithInitials: Story = {
  args: { src: null, initials: 'OR', alt: 'Olivia Rhye' },
};

export const WithFallbackIcon: Story = {
  args: { src: null, initials: '', alt: 'Unknown user' },
};

export const WithStatusOnline: Story = {
  args: {
    src: 'https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80',
    alt: 'Olivia Rhye',
    status: 'online',
  },
};

export const WithStatusOffline: Story = {
  args: {
    src: 'https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80',
    alt: 'Olivia Rhye',
    status: 'offline',
  },
};

export const Verified: Story = {
  args: {
    src: 'https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80',
    alt: 'Olivia Rhye',
    verified: true,
  },
};

export const WithCount: Story = {
  args: { count: 8, src: null, initials: '' },
};

export const Bordered: Story = {
  args: {
    border: true,
    src: 'https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80',
    alt: 'Olivia Rhye',
  },
};

export const Squared: Story = {
  args: {
    rounded: false,
    src: 'https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80',
    alt: 'Olivia Rhye',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
        <Avatar key={size} {...args} size={size} />
      ))}
    </div>
  ),
};
