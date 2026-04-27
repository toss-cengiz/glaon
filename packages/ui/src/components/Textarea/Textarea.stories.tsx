import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Textarea } from './Textarea';

// Explicit `Meta<typeof Textarea>` annotation (rather than `satisfies`)
// keeps the kit's unexported deep prop shapes (RAC `TextFieldProps`)
// out of the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
const meta: Meta<typeof Textarea> = {
  title: 'Web Primitives/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-textarea',
    },
  },
  args: {
    label: 'Description',
    placeholder: 'Tell us a bit about yourself…',
    size: 'md',
    rows: 4,
    isDisabled: false,
    isReadOnly: false,
    isRequired: false,
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
    tooltip: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    rows: { control: { type: 'number', min: 1, max: 20, step: 1 } },
    cols: { control: { type: 'number', min: 10, max: 100, step: 5 } },
    isDisabled: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
    hideRequiredIndicator: { control: 'boolean' },
    value: { control: 'text' },
    defaultValue: { control: 'text' },
    name: { control: 'text' },
    onChange: { control: false, action: 'changed' },
    onBlur: { control: false, action: 'blurred' },
    onFocus: { control: false, action: 'focused' },
    className: { control: false, table: { disable: true } },
    textAreaClassName: { control: false, table: { disable: true } },
    ref: { control: false, table: { disable: true } },
    textAreaRef: { control: false, table: { disable: true } },
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
type Story = StoryObj<typeof Textarea>;

// react-aria-components forwards a number of props from RAC TextField
// that we don't surface as Storybook controls; the F6 prop-coverage
// gate accepts them via this allowlist instead.
export const excludeFromArgs = [
  'autoFocus',
  'validate',
  'validationBehavior',
  'inputMode',
  'minLength',
  'maxLength',
  'pattern',
  'autoComplete',
  'enterKeyHint',
  'spellCheck',
  'autoCorrect',
  'autoCapitalize',
  'form',
  'translate',
  'slot',
  'children',
  'type',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'data-rac',
];

export const Default: Story = {};

export const WithHelper: Story = {
  args: {
    hint: 'Markdown is supported.',
  },
};

export const WithError: Story = {
  args: {
    hint: 'Description must be at least 10 characters.',
    isInvalid: true,
    defaultValue: 'too short',
  },
};

export const Disabled: Story = {
  args: { isDisabled: true, value: 'Locked content.' },
};

export const ReadOnly: Story = {
  args: { isReadOnly: true, value: 'Read-only content.' },
};

export const Required: Story = {
  args: { isRequired: true },
};

export const WithTooltip: Story = {
  args: {
    tooltip: 'We use this to populate your public profile.',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md'] as const).map((size) => (
        <Textarea key={size} {...args} size={size} label={`Size: ${size}`} />
      ))}
    </div>
  ),
};
