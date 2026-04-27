import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Radio, RadioGroup } from './Radio';

// Explicit `Meta<typeof Radio>` annotation (rather than `satisfies`)
// keeps the kit's unexported `RadioButtonProps` interface out of the
// exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
const meta: Meta<typeof Radio> = {
  title: 'Web Primitives/Radio',
  component: Radio,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-radio',
    },
  },
  args: {
    label: 'Email notifications',
    value: 'email',
    size: 'sm',
    isDisabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    value: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    isDisabled: { control: 'boolean' },
    onBlur: { control: false, action: 'blurred' },
    onFocus: { control: false, action: 'focused' },
    onFocusChange: { control: false, action: 'focus-changed' },
    onHoverChange: { control: false, action: 'hover-changed' },
    className: { control: false, table: { disable: true } },
    ref: { control: false, table: { disable: true } },
    inputRef: { control: false, table: { disable: true } },
  },
  decorators: [
    (Story) => (
      <RadioGroup defaultValue="email" aria-label="Notification channel">
        <Story />
      </RadioGroup>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Radio>;

// RAC-forwarded props not useful as Storybook knobs.
export const excludeFromArgs = [
  'autoFocus',
  'children',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'excludeFromTabOrder',
  'translate',
  'slot',
  'data-rac',
];

export const Default: Story = {};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const WithHint: Story = {
  args: {
    label: 'Email notifications',
    hint: 'Receive a digest every Monday.',
  },
};

export const InGroup: Story = {
  decorators: [
    () => (
      <RadioGroup
        defaultValue="email"
        aria-label="Notification channel"
        style={{ gap: 16, display: 'flex', flexDirection: 'column' }}
      >
        <Radio value="email" label="Email" hint="A weekly digest." />
        <Radio value="sms" label="SMS" hint="Immediate alerts." />
        <Radio value="push" label="Push" hint="App-only notifications." />
        <Radio value="none" label="None" isDisabled />
      </RadioGroup>
    ),
  ],
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['sm', 'md'] as const).map((size) => (
        <RadioGroup
          key={size}
          size={size}
          defaultValue="a"
          aria-label={`Group ${size}`}
          style={{ gap: 8, display: 'flex', flexDirection: 'column' }}
        >
          <Radio value="a" label={`Option A — size ${size}`} />
          <Radio value="b" label={`Option B — size ${size}`} />
        </RadioGroup>
      ))}
    </div>
  ),
};
