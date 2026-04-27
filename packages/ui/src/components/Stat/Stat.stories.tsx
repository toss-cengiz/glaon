import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { CurrencyDollar } from '@untitledui/icons';

import { Stat } from './Stat';

// Explicit `Meta<typeof Stat>` annotation (rather than `satisfies`)
// keeps storybook csf-internal types out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true`.
const meta: Meta<typeof Stat> = {
  title: 'Web Primitives/Stat',
  component: Stat,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-stat',
    },
  },
  args: {
    label: 'Total revenue',
    value: '$32,400',
    size: 'md',
  },
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    delta: { control: 'object' },
    prefix: { control: false, table: { disable: true } },
    className: { control: false, table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof Stat>;

export const Default: Story = {};

export const WithDeltaUp: Story = {
  args: {
    delta: { value: '+12.5%', direction: 'up' },
  },
};

export const WithDeltaDown: Story = {
  args: {
    delta: { value: '-3.2%', direction: 'down' },
  },
};

export const WithDeltaNeutral: Story = {
  args: {
    delta: { value: '0.0%', direction: 'neutral' },
  },
};

export const WithPrefix: Story = {
  args: {
    value: '32,400',
    prefix: <CurrencyDollar className="size-6" aria-hidden="true" />,
  },
};

export const Compact: Story = {
  args: { size: 'sm' },
};

export const Large: Story = {
  args: { size: 'lg', value: '1,284,930', label: 'Active users' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Stat key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
      <Stat label="Total revenue" value="$32,400" delta={{ value: '+12.5%', direction: 'up' }} />
      <Stat label="Active users" value="2,450" delta={{ value: '-3.2%', direction: 'down' }} />
      <Stat label="Conversion rate" value="3.84%" delta={{ value: '+0.6pp', direction: 'up' }} />
    </div>
  ),
};
