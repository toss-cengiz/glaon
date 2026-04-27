import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Spinner } from './Spinner';

// Explicit `Meta<typeof Spinner>` annotation (rather than `satisfies`)
// keeps the kit's unexported `LoadingIndicatorProps` interface out of
// the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true` and TS4023 fires when an exported `meta` resolves
// to a non-exported nominal type.
const meta: Meta<typeof Spinner> = {
  title: 'Web Primitives/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-spinner',
    },
  },
  args: {
    type: 'line-simple',
    size: 'sm',
    label: '',
  },
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['line-simple', 'line-spinner', 'dot-circle'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {};

export const LineSimple: Story = {
  args: { type: 'line-simple' },
};

export const LineSpinner: Story = {
  args: { type: 'line-spinner' },
};

export const DotCircle: Story = {
  args: { type: 'dot-circle' },
};

export const WithLabel: Story = {
  args: { type: 'line-spinner', size: 'md', label: 'Loading…' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Spinner key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const Types: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      {(['line-simple', 'line-spinner', 'dot-circle'] as const).map((type) => (
        <Spinner key={type} {...args} type={type} />
      ))}
    </div>
  ),
};
