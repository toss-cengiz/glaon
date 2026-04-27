import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Checkbox } from './Checkbox';

// Explicit `Meta<typeof Checkbox>` annotation (rather than `satisfies`)
// keeps the kit's unexported `CheckboxProps` interface out of the
// exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
const meta: Meta<typeof Checkbox> = {
  title: 'Web Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-checkbox',
    },
  },
  // RAC `<Checkbox>` switches into controlled mode the moment any of
  // `isSelected` / `isIndeterminate` / `isReadOnly` / `isRequired` is
  // present in the props (even when `false`). With Storybook's args
  // panel passing those defaults but no matching `onChange` handler
  // updating external state, the user can't toggle the checkbox at all.
  // Keep these props in `argTypes` (so the controls panel still
  // surfaces them as boolean knobs), but leave them out of `args` so
  // RAC manages selection state internally.
  args: {
    label: 'I agree to the terms',
    size: 'sm',
    isDisabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    isDisabled: { control: 'boolean' },
    isSelected: { control: 'boolean' },
    isIndeterminate: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
    defaultSelected: { control: 'boolean' },
    name: { control: 'text' },
    value: { control: 'text' },
    onChange: { control: false, action: 'changed' },
    onBlur: { control: false, action: 'blurred' },
    onFocus: { control: false, action: 'focused' },
    className: { control: false, table: { disable: true } },
    ref: { control: false, table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

// RAC-forwarded props that aren't useful as Storybook knobs but flow
// through type-checking; covered by the F6 prop-coverage gate.
export const excludeFromArgs = [
  'autoFocus',
  'children',
  'inputRef',
  'validate',
  'validationBehavior',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'aria-controls',
  'excludeFromTabOrder',
  'form',
  'translate',
  'slot',
  'data-rac',
];

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultSelected: true },
};

export const Indeterminate: Story = {
  args: { isIndeterminate: true, label: 'Select all' },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const DisabledChecked: Story = {
  args: { isDisabled: true, defaultSelected: true },
};

export const WithHint: Story = {
  args: {
    label: 'Subscribe to newsletter',
    hint: 'We only send updates once a month.',
  },
};

export const Required: Story = {
  args: { isRequired: true },
};

export const Invalid: Story = {
  args: { isInvalid: true, hint: 'You must agree to continue.' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['sm', 'md'] as const).map((size) => (
        <Checkbox key={size} {...args} size={size} label={`Size: ${size}`} />
      ))}
    </div>
  ),
};
