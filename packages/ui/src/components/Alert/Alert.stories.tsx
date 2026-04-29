import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Alert } from './Alert';
import { alertControls, alertExcludeFromArgs } from './Alert.controls';

const { args, argTypes } = defineControls(alertControls);

// Explicit `Meta<typeof Alert>` annotation (rather than `satisfies`) keeps
// storybook csf-internal types out of the exported `meta` signature —
// `tsc --noEmit` runs with `declaration: true` and trips TS2742 / TS4023
// when the inferred meta references types that aren't portably named.
//
// Phase 1.5: `args` + `argTypes` come from `Alert.controls.ts`;
// `tags: ['autodocs']` removed because `Alert.mdx` replaces the
// docs tab.
const meta: Meta<typeof Alert> = {
  title: 'Web Primitives/Alert',
  component: Alert,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-alert',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const excludeFromArgs = alertExcludeFromArgs;

export const Default: Story = {};

export const Info: Story = {
  args: { intent: 'info', title: 'Heads up — new release on Friday.' },
};

export const Success: Story = {
  args: {
    intent: 'success',
    title: 'Saved',
    description: 'Your changes are live.',
  },
};

export const Warning: Story = {
  args: {
    intent: 'warning',
    title: 'Token rotation in 24 hours',
    description: 'Re-authenticate before midnight.',
  },
};

export const Danger: Story = {
  args: {
    intent: 'danger',
    title: 'Could not save changes',
    description: 'Network error. Try again.',
  },
};

export const Dismissible: Story = {
  args: { dismissible: true },
};

export const TitleOnly: Story = {
  args: { description: undefined, title: 'A short status line' },
};

// Matrix story: iterates `intent` and renders every variant in a
// single canvas, so the controls panel hides `intent` (changing it on
// a matrix is meaningless). Other props still flow through `{...args}`.
export const Intents: Story = {
  parameters: { controls: { exclude: ['intent'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['info', 'success', 'warning', 'danger'] as const).map((intent) => (
        <Alert key={intent} {...args} intent={intent} title={`Intent: ${intent}`} />
      ))}
    </div>
  ),
};
