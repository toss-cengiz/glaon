import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Avatar } from './Avatar';
import { avatarControls, avatarExcludeFromArgs } from './Avatar.controls';

const { args, argTypes } = defineControls(avatarControls);

// Explicit `Meta<typeof Avatar>` annotation (rather than `satisfies`)
// keeps the kit's unexported `AvatarProps` shape out of the exported
// `meta` signature — `tsc --noEmit` runs with `declaration: true` and
// trips TS4023 / TS2742 when the inferred meta references types that
// aren't portably named.
//
// Phase 1.5: `args` + `argTypes` come from `Avatar.controls.ts`;
// `tags: ['autodocs']` removed because `Avatar.mdx` replaces the
// docs tab.
const meta: Meta<typeof Avatar> = {
  title: 'Web Primitives/Avatar',
  component: Avatar,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-avatar',
    },
  },
  args,
  argTypes,
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const excludeFromArgs = avatarExcludeFromArgs;

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

// Matrix story: iterates `size` and renders every variant in a
// single canvas, so the controls panel hides `size`. Other props
// still flow through `{...args}`.
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size'] } },
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
        <Avatar key={size} {...args} size={size} />
      ))}
    </div>
  ),
};
