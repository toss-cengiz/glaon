import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { FC } from 'react';
import { Text, View } from 'react-native';

import { PressableButton } from './PressableButton';

// Placeholder icons keep parity with the web Button stories until the
// shared Untitled UI icon catalog lands as its own primitive PR.
const PlusIcon: FC<{ color?: string; size?: number }> = ({ color = 'currentColor', size = 16 }) => (
  <Text style={{ color, fontSize: size, lineHeight: size, fontWeight: '600' }}>＋</Text>
);
const ArrowRightIcon: FC<{ color?: string; size?: number }> = ({
  color = 'currentColor',
  size = 16,
}) => <Text style={{ color, fontSize: size, lineHeight: size, fontWeight: '600' }}>→</Text>;

const ICONS = { none: undefined, plus: PlusIcon, arrowRight: ArrowRightIcon } as const;

const meta = {
  title: 'RN Primitives/PressableButton',
  component: PressableButton,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=rn-primitives-pressable-button',
    },
  },
  args: {
    children: 'Press me',
    size: 'sm',
    color: 'primary',
    isDisabled: false,
    isLoading: false,
    showTextWhileLoading: false,
    noTextPadding: false,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    color: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'tertiary',
        'primary-destructive',
        'secondary-destructive',
        'tertiary-destructive',
        'link-color',
        'link-gray',
        'link-destructive',
      ],
    },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    showTextWhileLoading: { control: 'boolean' },
    noTextPadding: { control: 'boolean' },
    iconLeading: {
      control: 'select',
      options: Object.keys(ICONS),
      mapping: ICONS,
    },
    iconTrailing: {
      control: 'select',
      options: Object.keys(ICONS),
      mapping: ICONS,
    },
    onPress: { action: 'pressed' },
  },
} satisfies Meta<typeof PressableButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { color: 'secondary' },
};

export const Tertiary: Story = {
  args: { color: 'tertiary' },
};

export const PrimaryDestructive: Story = {
  args: { color: 'primary-destructive', children: 'Delete' },
};

export const SecondaryDestructive: Story = {
  args: { color: 'secondary-destructive', children: 'Delete' },
};

export const LinkColor: Story = {
  args: { color: 'link-color', children: 'Read more' },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Saving',
    accessibilityLabel: 'Saving',
  },
};

export const LoadingWithText: Story = {
  args: { isLoading: true, showTextWhileLoading: true, children: 'Saving' },
};

export const WithLeadingIcon: Story = {
  args: { iconLeading: PlusIcon, children: 'Add item' },
};

export const WithTrailingIcon: Story = {
  args: { iconTrailing: ArrowRightIcon, children: 'Continue' },
};

export const Sizes: Story = {
  render: (args) => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <PressableButton key={size} {...args} size={size}>
          {size.toUpperCase()}
        </PressableButton>
      ))}
    </View>
  ),
};

export const Colors: Story = {
  render: (args) => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {(
        [
          'primary',
          'secondary',
          'tertiary',
          'primary-destructive',
          'secondary-destructive',
          'tertiary-destructive',
          'link-color',
          'link-gray',
          'link-destructive',
        ] as const
      ).map((color) => (
        <PressableButton key={color} {...args} color={color}>
          {color}
        </PressableButton>
      ))}
    </View>
  ),
};
