import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Alert, type AlertColor } from './Alert';
import { alertControls, alertExcludeFromArgs } from './Alert.controls';

const { args, argTypes } = defineControls(alertControls);

// Explicit `Meta<typeof Alert>` annotation (rather than `satisfies`)
// keeps the kit's deep `AlertFloating` / `AlertFullWidth` prop shapes
// out of the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
//
// #303: Alert is now a parametric wrap dispatching to
// `AlertFloating` (size='floating') or `AlertFullWidth`
// (size='full-width'). Color axis matches Figma's 6-value palette.
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
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const excludeFromArgs = alertExcludeFromArgs;

export const Default: Story = {};

export const Floating: Story = {
  args: { size: 'floating', color: 'brand', confirmLabel: 'View changes' },
};

export const FullWidth: Story = {
  args: { size: 'full-width', color: 'brand', confirmLabel: 'View changes' },
};

export const WithActions: Story = {
  args: {
    color: 'success',
    title: 'Settings saved',
    description: 'Your changes are live across the workspace.',
    confirmLabel: 'View changes',
    onConfirm: () => undefined,
    onDismiss: () => undefined,
  },
};

export const Persistent: Story = {
  args: {
    color: 'warning',
    title: 'Token rotation in 24 hours',
    description: 'Re-authenticate before midnight or jobs will fail.',
    confirmLabel: 'Re-authenticate',
    onConfirm: () => undefined,
    // No onDismiss → no close X → persistent until the user acts.
  },
};

export const TitleOnly: Story = {
  args: { description: undefined, title: 'A short status line' },
};

// Matrix story: iterates `color` and renders every variant in a
// single canvas, so the controls panel hides `color`. Other props
// still flow through `{...args}`.
const COLORS: AlertColor[] = ['default', 'brand', 'gray', 'error', 'warning', 'success'];

export const Colors: Story = {
  parameters: { controls: { exclude: ['color'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {COLORS.map((color) => (
        <Alert key={color} {...args} color={color} title={`Color: ${color}`} />
      ))}
    </div>
  ),
};

// Matrix story: iterates `size` to show the floating vs. full-width
// layout difference in one canvas. Other controls stay live.
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['floating', 'full-width'] as const).map((size) => (
        <Alert key={size} {...args} size={size} title={`Size: ${size}`} />
      ))}
    </div>
  ),
};
