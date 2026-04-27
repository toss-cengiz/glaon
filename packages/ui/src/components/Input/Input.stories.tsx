import type { ComponentType, HTMLAttributes } from 'react';

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { storybookIcons } from '../../icons/storybook';
import { Input } from './Input';

// The kit `Input` typed `icon` as `ComponentType<HTMLAttributes<...>>`
// while our shared picker (`icons/storybook.ts`) is typed loosely as
// `FC<any> | undefined`. Cast here once so individual stories don't
// need to repeat it; the runtime icons are real components.
type InputIcon = ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
const icon = (name: keyof typeof storybookIcons): InputIcon => storybookIcons[name] as InputIcon;

// Explicit `Meta<typeof Input>` annotation (rather than `satisfies`)
// keeps the kit's unexported deep prop shapes (RAC `TextFieldProps`)
// out of the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true` and trips TS4023 / TS2742 when the inferred
// meta references types that aren't portably named.
const meta: Meta<typeof Input> = {
  title: 'Web Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-input',
    },
  },
  args: {
    label: 'Email address',
    placeholder: 'olivia@untitledui.com',
    size: 'md',
    isDisabled: false,
    isReadOnly: false,
    isRequired: false,
    type: 'text',
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
    tooltip: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    type: {
      control: 'inline-radio',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    isDisabled: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    isInvalid: { control: 'boolean' },
    hideRequiredIndicator: { control: 'boolean' },
    icon: {
      control: 'select',
      options: Object.keys(storybookIcons),
      mapping: storybookIcons,
    },
    shortcut: { control: 'text' },
    value: { control: 'text' },
    defaultValue: { control: 'text' },
    name: { control: 'text' },
    onChange: { control: false, action: 'changed' },
    onBlur: { control: false, action: 'blurred' },
    onFocus: { control: false, action: 'focused' },
    className: { control: false, table: { disable: true } },
    inputClassName: { control: false, table: { disable: true } },
    iconClassName: { control: false, table: { disable: true } },
    wrapperClassName: { control: false, table: { disable: true } },
    tooltipClassName: { control: false, table: { disable: true } },
    ref: { control: false, table: { disable: true } },
    groupRef: { control: false, table: { disable: true } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

// react-aria-components forwards a number of props from RAC TextField
// (`autoFocus`, `validate`, `validationBehavior`, …) that we don't
// surface as Storybook controls; the F6 prop-coverage gate accepts
// them via this allowlist instead.
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
  'isInvalid',
  'translate',
  // Forwarded internally to `<TextField>` slot when used inside RAC
  // composite collections; not user-facing knobs.
  'slot',
  'children',
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
    hint: 'We will only use this address to send you order updates.',
  },
};

export const WithError: Story = {
  args: {
    hint: 'Enter a valid email address.',
    isInvalid: true,
    defaultValue: 'not-an-email',
  },
};

export const Disabled: Story = {
  args: { isDisabled: true, value: 'olivia@untitledui.com' },
};

export const ReadOnly: Story = {
  args: { isReadOnly: true, value: 'olivia@untitledui.com' },
};

export const Required: Story = {
  args: { isRequired: true },
};

export const WithLeadingIcon: Story = {
  args: { icon: icon('mail'), type: 'email' },
};

export const WithShortcut: Story = {
  args: { shortcut: '⌘ K', icon: icon('search'), label: 'Search' },
};

export const WithTooltip: Story = {
  args: {
    tooltip: 'We use this to send you receipts and login codes.',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    label: 'Password',
    placeholder: '••••••••',
    defaultValue: 'secret-token',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Input key={size} {...args} size={size} label={`Size: ${size}`} />
      ))}
    </div>
  ),
};
