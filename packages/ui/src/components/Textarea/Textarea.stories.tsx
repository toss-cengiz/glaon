import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Textarea } from './Textarea';
import { textareaControls, textareaExcludeFromArgs } from './Textarea.controls';

const { args, argTypes } = defineControls(textareaControls);

// Explicit `Meta<typeof Textarea>` annotation (rather than `satisfies`)
// keeps the kit's unexported deep prop shapes (RAC `TextFieldProps`)
// out of the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Textarea.controls.ts`;
// `tags: ['autodocs']` removed because `Textarea.mdx` replaces the
// docs tab.
const meta: Meta<typeof Textarea> = {
  title: 'Web Primitives/Textarea',
  component: Textarea,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-textarea',
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
type Story = StoryObj<typeof Textarea>;

export const excludeFromArgs = textareaExcludeFromArgs;

export const Default: Story = {};

export const WithHelper: Story = {
  args: {
    hint: 'Markdown is supported.',
  },
};

export const WithError: Story = {
  args: {
    hint: 'Description must be at least 10 characters.',
    isInvalid: true,
    defaultValue: 'too short',
  },
};

export const Disabled: Story = {
  args: { isDisabled: true, value: 'Locked content.' },
};

export const ReadOnly: Story = {
  args: { isReadOnly: true, value: 'Read-only content.' },
};

export const Required: Story = {
  args: { isRequired: true },
};

export const WithTooltip: Story = {
  args: {
    tooltip: 'We use this to populate your public profile.',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md'] as const).map((size) => (
        <Textarea key={size} {...args} size={size} label={`Size: ${size}`} />
      ))}
    </div>
  ),
};
