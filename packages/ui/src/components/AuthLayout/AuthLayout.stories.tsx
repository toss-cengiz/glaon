import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { type Mail01, Key01 } from '@untitledui/icons';

import { defineControls } from '../_internal/controls';
import { AuthLayout } from './AuthLayout';
import { authLayoutControls, authLayoutExcludeFromArgs } from './AuthLayout.controls';

const { args, argTypes } = defineControls(authLayoutControls);

const meta: Meta<typeof AuthLayout> = {
  title: 'App Primitives/AuthLayout',
  component: AuthLayout,
  parameters: {
    layout: 'fullscreen',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=134-3146',
    },
  },
  args,
  argTypes,
};

export default meta;
type Story = StoryObj<typeof AuthLayout>;

export const excludeFromArgs = authLayoutExcludeFromArgs;

// Form fields only. The title + subtitle now live on AuthLayout
// itself (via `title` / `subtitle` props) so stories declare them
// once at the args level instead of repeating the header markup
// inside every render fn.
const placeholderForm = (
  <div className="flex flex-col gap-4">
    <div className="rounded-lg bg-secondary px-3 py-3 text-sm text-tertiary">Email field</div>
    <div className="rounded-lg bg-secondary px-3 py-3 text-sm text-tertiary">Password field</div>
    <div className="rounded-lg bg-brand_solid px-3 py-3 text-center text-sm font-semibold text-white">
      Sign in
    </div>
  </div>
);

const placeholderImage = (
  <div className="h-full w-full bg-gradient-to-br from-brand_solid_subtle to-brand_solid" />
);

const featuredIcon = (Icon: typeof Mail01) => (
  <div className="flex size-14 items-center justify-center rounded-xl ring-1 ring-primary">
    <Icon className="size-7 text-secondary" />
  </div>
);

export const Split: Story = {
  args: {
    variant: 'split',
    title: 'Welcome back',
    subtitle: 'Welcome back! Please enter your details.',
  },
  render: (args) => (
    <AuthLayout {...args} imageSlot={placeholderImage}>
      {placeholderForm}
    </AuthLayout>
  ),
};

export const SplitWithoutImage: Story = {
  args: {
    variant: 'split',
    title: 'Welcome back',
    subtitle: 'Welcome back! Please enter your details.',
  },
  render: (args) => (
    <AuthLayout {...args} imageSlot={null}>
      {placeholderForm}
    </AuthLayout>
  ),
};

const centeredForm = (
  <div className="flex w-full flex-col gap-4">
    <div className="rounded-lg bg-secondary px-3 py-3 text-left text-sm text-tertiary">
      Email field
    </div>
    <div className="rounded-lg bg-brand_solid px-3 py-3 text-center text-sm font-semibold text-white">
      Reset password
    </div>
  </div>
);

export const Centered: Story = {
  args: {
    variant: 'centered',
    title: 'Forgot password?',
    subtitle: "No worries, we'll send you reset instructions.",
  },
  render: (args) => <AuthLayout {...args}>{centeredForm}</AuthLayout>,
};

export const CenteredWithIcon: Story = {
  args: {
    variant: 'centered',
    title: 'Forgot password?',
    subtitle: "No worries, we'll send you reset instructions.",
  },
  render: (args) => (
    <AuthLayout {...args} iconSlot={featuredIcon(Key01)}>
      {centeredForm}
    </AuthLayout>
  ),
};
