import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import {
  ComboBox,
  MultiSelect,
  NativeSelect,
  Select,
  SelectItem,
  type SelectItemType,
} from './Select';
import { selectControls, selectExcludeFromArgs } from './Select.controls';

const { args, argTypes } = defineControls(selectControls);

// Explicit `Meta<typeof Select>` annotation (rather than `satisfies`)
// keeps the kit's deep RAC generic chains (`AriaSelectProps<SelectItemType>`
// etc.) out of the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Select.controls.ts`;
// `tags: ['autodocs']` removed because `Select.mdx` replaces the
// docs tab.
const meta: Meta<typeof Select> = {
  title: 'Web Primitives/Select',
  component: Select,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-select',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const excludeFromArgs = selectExcludeFromArgs;

const COUNTRIES: SelectItemType[] = [
  { id: 'tr', label: 'Türkiye' },
  { id: 'us', label: 'United States' },
  { id: 'gb', label: 'United Kingdom' },
  { id: 'de', label: 'Germany' },
  { id: 'fr', label: 'France' },
  { id: 'es', label: 'Spain' },
  { id: 'it', label: 'Italy' },
  { id: 'jp', label: 'Japan' },
  { id: 'br', label: 'Brazil' },
  { id: 'in', label: 'India' },
];

const renderItem = (item: SelectItemType) => (
  <SelectItem key={item.id} id={item.id} label={item.label ?? ''} />
);

export const Default: Story = {
  args: { items: COUNTRIES, children: renderItem },
};

export const WithDefaultValue: Story = {
  args: {
    items: COUNTRIES,
    children: renderItem,
    defaultSelectedKey: 'tr',
  },
};

export const WithHint: Story = {
  args: {
    items: COUNTRIES,
    children: renderItem,
    hint: 'Select your billing country.',
  },
};

export const WithError: Story = {
  args: {
    items: COUNTRIES,
    children: renderItem,
    isInvalid: true,
    hint: 'Country is required.',
  },
};

export const Disabled: Story = {
  args: {
    items: COUNTRIES,
    children: renderItem,
    isDisabled: true,
    defaultSelectedKey: 'tr',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Select key={size} {...args} size={size} label={`Size: ${size}`} items={COUNTRIES}>
          {renderItem}
        </Select>
      ))}
    </div>
  ),
};

const LONG_LIST: SelectItemType[] = Array.from({ length: 200 }, (_, i) => ({
  id: `item-${i.toString()}`,
  label: `Option ${(i + 1).toString().padStart(3, '0')}`,
}));

export const LongList: Story = {
  args: {
    items: LONG_LIST,
    children: renderItem,
    label: 'Pick one of 200',
    placeholder: 'Scroll for more',
  },
};

// `ComboBox` is a sibling kit primitive; demonstrate it inline so the
// search / filter affordance is reachable from the Select story
// catalogue without a separate `Combobox.stories.tsx` file.
export const WithSearch: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      <ComboBox label="Country (searchable)" placeholder="Type to filter" items={COUNTRIES}>
        {renderItem}
      </ComboBox>
    </div>
  ),
};

export const Multi: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      <MultiSelect
        label="Languages"
        placeholder="Pick one or more"
        items={[
          { id: 'tr', label: 'Türkçe' },
          { id: 'en', label: 'English' },
          { id: 'de', label: 'Deutsch' },
          { id: 'fr', label: 'Français' },
          { id: 'es', label: 'Español' },
        ]}
      >
        {renderItem}
      </MultiSelect>
    </div>
  ),
};

export const Native: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      <NativeSelect
        label="Country (native)"
        options={COUNTRIES.map((c) => ({
          label: c.label ?? '',
          value: c.id.toString(),
        }))}
      />
    </div>
  ),
};
