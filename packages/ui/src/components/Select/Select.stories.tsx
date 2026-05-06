import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';
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

// Matrix story: iterates `size` and renders every variant in a
// single canvas, so the controls panel hides `size` and the
// per-instance `label` (which is overridden by `Size: ${size}`).
// Other props still flow through `{...args}`.
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size', 'label'] } },
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

// Item content composition stories — kit `SelectItem` already supports
// `icon`, `avatarUrl`, `supportingText`, `selectionIndicator` and
// `selectionIndicatorAlign`; these stories surface that matrix in
// Storybook so designers can review the variants against the Figma
// frame (Design System / Select node 10673-194380).

const APPS: SelectItemType[] = [
  { id: 'mail', label: 'Mail', icon: storybookIcons.mail },
  { id: 'settings', label: 'Settings', icon: storybookIcons.settings },
  { id: 'inbox', label: 'Inbox', icon: storybookIcons.bell },
  { id: 'profile', label: 'Profile', icon: storybookIcons.user },
];

const renderItemWithIcon = (item: SelectItemType) => (
  <SelectItem key={item.id} id={item.id} label={item.label ?? ''} icon={item.icon} />
);

export const WithLeadingIcon: Story = {
  args: {
    items: APPS,
    children: renderItemWithIcon,
    label: 'Section',
    placeholder: 'Pick a section',
  },
};

const TEAM: SelectItemType[] = [
  {
    id: 'olivia',
    label: 'Olivia Rhye',
    avatarUrl: 'https://www.untitledui.com/images/avatars/olivia-rhye?bg=%23E0E0E0',
    supportingText: 'olivia@untitledui.com',
  },
  {
    id: 'phoenix',
    label: 'Phoenix Baker',
    avatarUrl: 'https://www.untitledui.com/images/avatars/phoenix-baker?bg=%23E0E0E0',
    supportingText: 'phoenix@untitledui.com',
  },
  {
    id: 'lana',
    label: 'Lana Steiner',
    avatarUrl: 'https://www.untitledui.com/images/avatars/lana-steiner?bg=%23E0E0E0',
    supportingText: 'lana@untitledui.com',
  },
];

// `exactOptionalPropertyTypes: true` rejects passing an explicit
// `undefined` to optional string props; spread guards keep us
// schema-compatible whether or not the fixture supplies the field.
const renderTeamItem = (item: SelectItemType) => (
  <SelectItem
    key={item.id}
    id={item.id}
    label={item.label ?? ''}
    {...(item.avatarUrl !== undefined ? { avatarUrl: item.avatarUrl } : {})}
    {...(item.supportingText !== undefined ? { supportingText: item.supportingText } : {})}
  />
);

export const WithAvatar: Story = {
  args: {
    items: TEAM,
    children: renderTeamItem,
    label: 'Assign to',
    placeholder: 'Pick a teammate',
  },
};

const PLANS: SelectItemType[] = [
  { id: 'free', label: 'Free', supportingText: '$0 / month' },
  { id: 'starter', label: 'Starter', supportingText: '$10 / month' },
  { id: 'pro', label: 'Pro', supportingText: '$30 / month' },
  { id: 'enterprise', label: 'Enterprise', supportingText: 'Contact sales' },
];

const renderPlanItem = (item: SelectItemType) => (
  <SelectItem
    key={item.id}
    id={item.id}
    label={item.label ?? ''}
    {...(item.supportingText !== undefined ? { supportingText: item.supportingText } : {})}
  />
);

export const WithSupportingText: Story = {
  args: {
    items: PLANS,
    children: renderPlanItem,
    label: 'Plan',
    placeholder: 'Choose a plan',
  },
};

// `selectionIndicator` matrix — checkmark right (default), checkmark
// left, checkbox right, checkbox left, none. Custom `children`
// renderer so each story can wire the prop without re-declaring the
// item list.

const renderItemWithIndicator = (
  indicator: 'checkmark' | 'checkbox' | 'none',
  align: 'left' | 'right',
) =>
  function ItemWithIndicator(item: SelectItemType) {
    return (
      <SelectItem
        key={item.id}
        id={item.id}
        label={item.label ?? ''}
        selectionIndicator={indicator}
        selectionIndicatorAlign={align}
      />
    );
  };

export const CheckmarkLeft: Story = {
  args: {
    items: COUNTRIES,
    children: renderItemWithIndicator('checkmark', 'left'),
    defaultSelectedKey: 'tr',
    label: 'Country',
  },
};

export const CheckboxIndicator: Story = {
  args: {
    items: COUNTRIES,
    children: renderItemWithIndicator('checkbox', 'right'),
    defaultSelectedKey: 'tr',
    label: 'Country',
  },
};

export const NoIndicator: Story = {
  args: {
    items: COUNTRIES,
    children: renderItemWithIndicator('none', 'right'),
    defaultSelectedKey: 'tr',
    label: 'Country',
  },
};

const ITEMS_WITH_DISABLED: SelectItemType[] = [
  { id: 'free', label: 'Free' },
  { id: 'starter', label: 'Starter' },
  { id: 'pro', label: 'Pro', isDisabled: true },
  { id: 'enterprise', label: 'Enterprise' },
];

const renderItemHonouringDisabled = (item: SelectItemType) => (
  <SelectItem
    key={item.id}
    id={item.id}
    label={item.label ?? ''}
    {...(item.isDisabled !== undefined ? { isDisabled: item.isDisabled } : {})}
  />
);

export const DisabledItem: Story = {
  args: {
    items: ITEMS_WITH_DISABLED,
    children: renderItemHonouringDisabled,
    label: 'Plan',
    placeholder: 'Choose a plan',
  },
};

export const EmptyState: Story = {
  args: {
    items: [],
    children: renderItem,
    label: 'Empty list',
    placeholder: 'No options available',
  },
};

// `OpenState` — popover-open baseline for Chromatic. `isOpen` keeps
// the listbox visible without user interaction; `docs.disable` hides
// it from MDX so the regular variant catalogue stays clean.
export const OpenState: Story = {
  parameters: { docs: { disable: true } },
  args: {
    items: COUNTRIES,
    children: renderItem,
    label: 'Country',
    placeholder: 'Select your billing country.',
    isOpen: true,
  },
};
