import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Checkbox } from './Checkbox';
import { checkboxControls, checkboxExcludeFromArgs } from './Checkbox.controls';

const { args, argTypes } = defineControls(checkboxControls);

// Explicit `Meta<typeof Checkbox>` annotation (rather than `satisfies`)
// keeps the kit's unexported `CheckboxProps` interface out of the
// exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Checkbox.controls.ts`;
// `tags: ['autodocs']` removed because `Checkbox.mdx` replaces the
// docs tab.
const meta: Meta<typeof Checkbox> = {
  title: 'Web Primitives/Checkbox',
  component: Checkbox,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-checkbox',
    },
  },
  args,
  argTypes,
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const excludeFromArgs = checkboxExcludeFromArgs;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultSelected: true },
};

export const Indeterminate: Story = {
  args: { isIndeterminate: true, label: 'Select all' },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const DisabledChecked: Story = {
  args: { isDisabled: true, defaultSelected: true },
};

export const WithHint: Story = {
  args: {
    label: 'Subscribe to newsletter',
    hint: 'We only send updates once a month.',
  },
};

export const Required: Story = {
  args: { isRequired: true },
};

export const Invalid: Story = {
  args: { isInvalid: true, hint: 'You must agree to continue.' },
};

// Matrix story: iterates `size` and renders every variant in a
// single canvas, so the controls panel hides `size` and the
// per-instance `label` (which is overridden by `Size: ${size}`).
// Other props still flow through `{...args}`.
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size', 'label'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['sm', 'md'] as const).map((size) => (
        <Checkbox key={size} {...args} size={size} label={`Size: ${size}`} />
      ))}
    </div>
  ),
};
