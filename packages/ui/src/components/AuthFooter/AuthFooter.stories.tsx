import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { AuthFooter } from './AuthFooter';
import { authFooterControls, authFooterExcludeFromArgs } from './AuthFooter.controls';

const { args, argTypes } = defineControls(authFooterControls);

const meta: Meta<typeof AuthFooter> = {
  title: 'App Primitives/AuthFooter',
  component: AuthFooter,
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
type Story = StoryObj<typeof AuthFooter>;

export const excludeFromArgs = authFooterExcludeFromArgs;

export const LoginContext: Story = {
  args: {
    prompt: "Don't have an account?",
    linkText: 'Sign up',
    linkHref: '/sign-up',
  },
};

export const SignupContext: Story = {
  args: {
    prompt: 'Already have an account?',
    linkText: 'Log in',
    linkHref: '/login',
  },
};

export const ForgotPasswordContext: Story = {
  args: {
    prompt: '',
    linkText: 'Back to log in',
    linkHref: '/login',
    iconLeading: 'arrow-left',
  },
};
