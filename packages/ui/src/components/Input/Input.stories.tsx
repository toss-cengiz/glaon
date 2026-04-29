import type { ComponentType, HTMLAttributes } from 'react';

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';
import { Input } from './Input';
import { inputControls, inputExcludeFromArgs } from './Input.controls';

// The kit `Input` typed `icon` as `ComponentType<HTMLAttributes<...>>`
// while our shared picker (`icons/storybook.ts`) is typed loosely as
// `FC<any> | undefined`. Cast here once so individual stories don't
// need to repeat it; the runtime icons are real components.
type InputIcon = ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
const icon = (name: keyof typeof storybookIcons): InputIcon => storybookIcons[name] as InputIcon;

const { args, argTypes } = defineControls(inputControls);

// Explicit `Meta<typeof Input>` annotation (rather than `satisfies`)
// keeps the kit's unexported deep prop shapes (RAC `TextFieldProps`)
// out of the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true` and trips TS4023 / TS2742 when the inferred
// meta references types that aren't portably named.
//
// Phase 1.5: `args` + `argTypes` come from `Input.controls.ts`;
// `tags: ['autodocs']` removed because `Input.mdx` replaces the
// docs tab.
const meta: Meta<typeof Input> = {
  title: 'Web Primitives/Input',
  component: Input,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-input',
    },
  },
  args,
  argTypes,
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

export const excludeFromArgs = inputExcludeFromArgs;

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

// Matrix story: iterates `size` and renders every variant in a
// single canvas, so the controls panel hides `size` and the
// per-instance `label` (which is overridden by `Size: ${size}`).
// Other props still flow through `{...args}`.
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size', 'label'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Input key={size} {...args} size={size} label={`Size: ${size}`} />
      ))}
    </div>
  ),
};
