import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Switch } from './Switch';
import { switchControls, switchExcludeFromArgs } from './Switch.controls';

const { args, argTypes } = defineControls(switchControls);

// Explicit `Meta<typeof Switch>` annotation (rather than `satisfies`)
// keeps the kit's unexported `ToggleProps` interface out of the
// exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Switch.controls.ts`;
// `tags: ['autodocs']` removed because `Switch.mdx` replaces the
// docs tab.
const meta: Meta<typeof Switch> = {
  title: 'Web Primitives/Switch',
  component: Switch,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-switch',
    },
  },
  args,
  argTypes,
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const excludeFromArgs = switchExcludeFromArgs;

export const Default: Story = {};

export const On: Story = {
  args: { defaultSelected: true },
};

export const Slim: Story = {
  args: { slim: true, defaultSelected: true },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const DisabledOn: Story = {
  args: { isDisabled: true, defaultSelected: true },
};

export const WithHint: Story = {
  args: {
    label: 'Enable notifications',
    hint: 'You can change this later.',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['sm', 'md'] as const).map((size) => (
        <Switch key={size} {...args} size={size} label={`Size: ${size}`} />
      ))}
    </div>
  ),
};
