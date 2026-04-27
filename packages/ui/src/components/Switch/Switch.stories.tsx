import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Switch } from './Switch';

// Explicit `Meta<typeof Switch>` annotation (rather than `satisfies`)
// keeps the kit's unexported `ToggleProps` interface out of the
// exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
const meta: Meta<typeof Switch> = {
  title: 'Web Primitives/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-switch',
    },
  },
  // RAC `<Switch>` switches into controlled mode the moment `isSelected`
  // is present in the props (even when `false`). With Storybook's args
  // panel passing that default but no matching `onChange` handler, the
  // user can't toggle the switch at all. Keep `isSelected` in
  // `argTypes` (so the controls panel still surfaces it as a boolean
  // knob), but leave it out of `args` so RAC manages selection state
  // internally.
  args: {
    label: 'Enable notifications',
    size: 'sm',
    slim: false,
    isDisabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    slim: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isSelected: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
    defaultSelected: { control: 'boolean' },
    name: { control: 'text' },
    value: { control: 'text' },
    onChange: { control: false, action: 'changed' },
    onBlur: { control: false, action: 'blurred' },
    onFocus: { control: false, action: 'focused' },
    className: { control: false, table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

// RAC-forwarded props not useful as Storybook knobs.
export const excludeFromArgs = [
  'autoFocus',
  'children',
  'inputRef',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'aria-controls',
  'excludeFromTabOrder',
  'form',
  'translate',
  'slot',
  'data-rac',
];

export const Default: Story = {};

export const On: Story = {
  args: { defaultSelected: true },
};

export const Slim: Story = {
  args: { slim: true, defaultSelected: true },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const DisabledOn: Story = {
  args: { isDisabled: true, defaultSelected: true },
};

export const WithHint: Story = {
  args: {
    label: 'Enable notifications',
    hint: 'You can change this later.',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['sm', 'md'] as const).map((size) => (
        <Switch key={size} {...args} size={size} label={`Size: ${size}`} />
      ))}
    </div>
  ),
};
