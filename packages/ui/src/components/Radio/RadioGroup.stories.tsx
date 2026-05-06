import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';
import { radioGroupControls, radioGroupExcludeFromArgs } from './RadioGroup.controls';

const { args, argTypes } = defineControls(radioGroupControls);

const meta: Meta<typeof RadioGroup> = {
  title: 'Web Primitives/RadioGroup',
  component: RadioGroup,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-radio-group',
    },
  },
  args,
  argTypes,
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const excludeFromArgs = radioGroupExcludeFromArgs;

const NOTIFICATION_RADIOS = (
  <>
    <Radio value="email" label="Email" />
    <Radio value="sms" label="SMS" />
    <Radio value="push" label="Push" />
  </>
);

const PLAN_TERM_RADIOS = (
  <>
    <Radio value="monthly" label="Monthly" />
    <Radio value="yearly" label="Yearly" />
    <Radio value="lifetime" label="Lifetime" />
  </>
);

export const Default: Story = {
  args: {
    label: 'Notification channel',
    defaultValue: 'email',
    children: NOTIFICATION_RADIOS,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Notification channel',
    description: "We'll only contact you about account activity.",
    defaultValue: 'email',
    children: NOTIFICATION_RADIOS,
  },
};

export const WithError: Story = {
  args: {
    label: 'Notification channel',
    errorMessage: 'Please choose how we should reach you.',
    children: NOTIFICATION_RADIOS,
  },
};

export const Required: Story = {
  args: {
    label: 'Notification channel',
    isRequired: true,
    children: NOTIFICATION_RADIOS,
  },
};

// `WithTooltip` story is intentionally omitted: the kit's `<Label
// tooltip>` slot renders a help-icon button without an accessible
// name, which fails axe `button-name`. The `tooltip` prop is still
// supported on the wrap; we just don't expose a Storybook story
// until the kit gives the trigger an `aria-label`. Track in #387
// follow-up.

export const Horizontal: Story = {
  args: {
    label: 'Plan term',
    description: 'You can change this later.',
    orientation: 'horizontal',
    defaultValue: 'monthly',
    children: PLAN_TERM_RADIOS,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Notification channel',
    isDisabled: true,
    defaultValue: 'email',
    children: NOTIFICATION_RADIOS,
  },
};

// Card layout — `<Radio.Card>` instead of flat radios. Demonstrates
// the RadioGroup wrap accepting either layout under the same form
// contract (label / description / horizontal etc).
export const CardLayout: Story = {
  args: {
    label: 'Plan',
    description: 'You can change this later from billing settings.',
    defaultValue: 'pro',
    children: (
      <>
        <Radio.Card value="free" label="Free" description="$0 / month" />
        <Radio.Card value="starter" label="Starter" description="$10 / month" />
        <Radio.Card value="pro" label="Pro" description="$30 / month" />
      </>
    ),
  },
};

export const CardLayoutHorizontal: Story = {
  args: {
    label: 'Plan term',
    orientation: 'horizontal',
    defaultValue: 'yearly',
    children: (
      <>
        <Radio.Card value="monthly" label="Monthly" description="$30 / month" />
        <Radio.Card value="yearly" label="Yearly" description="$300 / year — save 17 %" />
      </>
    ),
  },
};
