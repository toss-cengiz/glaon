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

// Matrix story: iterates `size` and renders every variant in a
// single canvas, so the controls panel hides `size` and the
// per-instance `label` (which is overridden by `Size: ${size}`).
// Other props still flow through `{...args}`.
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size', 'label'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md'] as const).map((size) => (
        <Textarea key={size} {...args} size={size} label={`Size: ${size}`} />
      ))}
    </div>
  ),
};

// `variant='tags-inner'` swaps the multi-line capture surface for a
// chip-based multi-value input. Confirm a tag with Enter / comma;
// Backspace on the empty input pops the last chip.
export const TagsInner: Story = {
  args: {
    variant: 'tags-inner',
    label: 'Recipients',
    placeholder: 'Add an email and press Enter…',
    hint: 'Confirm with Enter or comma. Backspace removes the last chip.',
  },
};

// Initial chip list rendered via `defaultTags` (uncontrolled). Use
// for forms that hydrate from server state on mount.
export const TagsInnerWithValues: Story = {
  args: {
    variant: 'tags-inner',
    label: 'Tags',
    placeholder: 'Add a tag…',
    defaultTags: ['design-system', 'phase-1', 'ui'],
  },
};

// Combine `tags-inner` with `isInvalid` to surface form validation —
// the surface ring re-styles red and the hint inherits error styling
// (the kit's `HintText` flips colour automatically). axe verifies
// `aria-invalid` + `aria-describedby` plumb through to the typing
// area below the chips.
export const TagsInnerWithError: Story = {
  args: {
    variant: 'tags-inner',
    label: 'Recipients',
    placeholder: 'Add an email…',
    defaultTags: ['marketing@example.com'],
    isInvalid: true,
    hint: 'At least one engineering recipient is required.',
  },
};

// `addTagOn` set to `[',']` confirms only on commas — useful for
// CSV-style input where Enter should drop a newline (e.g. multi-line
// addresses, paragraph-separated keywords).
export const TagsInnerComma: Story = {
  args: {
    variant: 'tags-inner',
    label: 'Keywords',
    placeholder: 'Type a keyword and press , …',
    defaultTags: ['monorepo'],
    addTagOn: [','],
  },
};

// Side-by-side variant gallery so designers can verify the two
// surfaces look like family members — same ring + focus + invalid
// affordances, just two different content layouts.
export const Variants: Story = {
  parameters: { controls: { exclude: ['variant', 'label', 'placeholder', 'defaultTags'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Textarea
        {...args}
        variant="default"
        label="Default — free-form description"
        placeholder="Tell us a bit about yourself…"
      />
      <Textarea
        {...args}
        variant="tags-inner"
        label="Tags inner — multi-value capture"
        placeholder="Add a tag and press Enter…"
        defaultTags={['frontend', 'tooling']}
      />
    </div>
  ),
};
