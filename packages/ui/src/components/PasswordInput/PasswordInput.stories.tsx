import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { PasswordInput } from './PasswordInput';
import { passwordInputControls, passwordInputExcludeFromArgs } from './PasswordInput.controls';

const { args, argTypes } = defineControls(passwordInputControls);

const meta: Meta<typeof PasswordInput> = {
  title: 'App Primitives/PasswordInput',
  component: PasswordInput,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1267-132204',
    },
  },
  args,
  argTypes,
};

export default meta;
type Story = StoryObj<typeof PasswordInput>;

export const excludeFromArgs = passwordInputExcludeFromArgs;

export const Default: Story = {};

export const Masked: Story = {
  args: {
    label: 'Password',
    defaultValue: 'correct horse battery staple',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Password',
    hint: 'Must be at least 8 characters.',
    autoComplete: 'new-password',
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    defaultValue: '12345',
    error: 'Password must be at least 8 characters.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Password',
    defaultValue: 'locked',
    isDisabled: true,
  },
};
