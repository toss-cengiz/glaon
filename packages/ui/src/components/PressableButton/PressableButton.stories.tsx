import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { PressableButton } from './PressableButton';

const meta = {
  title: 'RN Primitives/PressableButton',
  component: PressableButton,
  tags: ['autodocs'],
  args: {
    children: 'Press me',
    variant: 'primary',
    size: 'md',
    disabled: false,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    onPress: { action: 'pressed' },
  },
} satisfies Meta<typeof PressableButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Sizes: Story = {
  render: (args) => (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <PressableButton {...args} size="sm">
        Small
      </PressableButton>
      <PressableButton {...args} size="md">
        Medium
      </PressableButton>
      <PressableButton {...args} size="lg">
        Large
      </PressableButton>
    </View>
  ),
};
