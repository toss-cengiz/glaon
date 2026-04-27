import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { PressableButton } from './PressableButton';

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
    intent: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
  },
  argTypes: {
    intent: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary', 'destructive'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    leadingIcon: { control: false },
    onPress: { action: 'pressed' },
  },
} satisfies Meta<typeof PressableButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { intent: 'secondary' },
};

export const Tertiary: Story = {
  args: { intent: 'tertiary' },
};

export const Destructive: Story = {
  args: { intent: 'destructive' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  args: { loading: true, children: 'Saving' },
};

export const WithLeadingIcon: Story = {
  args: {
    leadingIcon: <Text style={{ color: 'inherit', fontSize: 14 }}>+</Text>,
    children: 'Add item',
  },
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
