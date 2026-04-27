import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { storybookIcons } from '../../icons/storybook';
import { Alert } from './Alert';

// Explicit `Meta<typeof Alert>` annotation (rather than `satisfies`) keeps
// storybook csf-internal types out of the exported `meta` signature —
// `tsc --noEmit` runs with `declaration: true` and trips TS2742 / TS4023
// when the inferred meta references types that aren't portably named.
const meta: Meta<typeof Alert> = {
  title: 'Web Primitives/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-alert',
    },
  },
  args: {
    title: 'New feature available',
    description: 'Check out the new dashboard.',
    intent: 'info',
    dismissible: false,
    dismissLabel: 'Dismiss',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    intent: {
      control: 'inline-radio',
      options: ['info', 'success', 'warning', 'danger'],
    },
    dismissible: { control: 'boolean' },
    dismissLabel: { control: 'text' },
    icon: {
      control: 'select',
      options: Object.keys(storybookIcons),
      mapping: storybookIcons,
    },
    onDismiss: { control: false, action: 'dismissed' },
    className: { control: false, table: { disable: true } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {};

export const Info: Story = {
  args: { intent: 'info', title: 'Heads up — new release on Friday.' },
};

export const Success: Story = {
  args: {
    intent: 'success',
    title: 'Saved',
    description: 'Your changes are live.',
  },
};

export const Warning: Story = {
  args: {
    intent: 'warning',
    title: 'Token rotation in 24 hours',
    description: 'Re-authenticate before midnight.',
  },
};

export const Danger: Story = {
  args: {
    intent: 'danger',
    title: 'Could not save changes',
    description: 'Network error. Try again.',
  },
};

export const Dismissible: Story = {
  args: { dismissible: true },
};

export const TitleOnly: Story = {
  args: { description: undefined, title: 'A short status line' },
};

export const Intents: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['info', 'success', 'warning', 'danger'] as const).map((intent) => (
        <Alert key={intent} {...args} intent={intent} title={`Intent: ${intent}`} />
      ))}
    </div>
  ),
};
