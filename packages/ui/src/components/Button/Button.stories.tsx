import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Button } from './Button';

const meta = {
  title: 'Web Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-button',
    },
  },
  args: {
    children: 'Click me',
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
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;

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
    leadingIcon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    ),
    children: 'Add item',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};
