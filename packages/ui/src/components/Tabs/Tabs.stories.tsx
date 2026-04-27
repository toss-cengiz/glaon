import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { storybookIcons } from '../../icons/storybook';
import { Tabs } from './Tabs';

// Explicit `Meta<typeof Tabs>` annotation (rather than `satisfies`)
// keeps the kit's deep RAC generic chains out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true`.
const meta: Meta<typeof Tabs> = {
  title: 'Web Primitives/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-tabs',
    },
  },
  args: {
    defaultSelectedKey: 'overview',
    orientation: 'horizontal',
    keyboardActivation: 'manual',
  },
  argTypes: {
    defaultSelectedKey: { control: 'text' },
    selectedKey: { control: 'text' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    keyboardActivation: { control: 'inline-radio', options: ['automatic', 'manual'] },
    isDisabled: { control: 'boolean' },
    onSelectionChange: { control: false, action: 'selection-changed' },
    children: { control: false, table: { disable: true } },
    className: { control: false, table: { disable: true } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 640 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// `react-docgen-typescript` walks the static-property namespace on
// `Tabs` (Tabs.List, Tabs.Trigger, Tabs.Content) and surfaces their
// own props on the root signature too. The TabList-only props
// (`size`, `type`, `items`, `fullWidth`) belong on `<Tabs.List>` per
// the Glaon API; expose them via the sub-component story rather than
// the root meta.
export const excludeFromArgs = [
  // TabList-only props (set on `<Tabs.List type=… size=… fullWidth>`).
  'size',
  'type',
  'items',
  'fullWidth',
  // RAC-forwarded props not useful as Storybook knobs.
  'autoFocus',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'translate',
  'slot',
  'data-rac',
  'ref',
  'id',
  'style',
  'dir',
];

const samplePanel = (text: string): ReactNode => (
  <div className="p-4 text-sm text-secondary">{text}</div>
);

export const Default: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List type="button-brand">
        <Tabs.Trigger id="overview" label="Overview" />
        <Tabs.Trigger id="settings" label="Settings" />
        <Tabs.Trigger id="billing" label="Billing" />
      </Tabs.List>
      <Tabs.Content id="overview">{samplePanel('Overview content lives here.')}</Tabs.Content>
      <Tabs.Content id="settings">{samplePanel('Settings content lives here.')}</Tabs.Content>
      <Tabs.Content id="billing">{samplePanel('Billing content lives here.')}</Tabs.Content>
    </Tabs>
  ),
};

export const Underline: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List type="underline">
        <Tabs.Trigger id="overview" label="Overview" />
        <Tabs.Trigger id="settings" label="Settings" />
        <Tabs.Trigger id="billing" label="Billing" />
      </Tabs.List>
      <Tabs.Content id="overview">{samplePanel('Overview.')}</Tabs.Content>
      <Tabs.Content id="settings">{samplePanel('Settings.')}</Tabs.Content>
      <Tabs.Content id="billing">{samplePanel('Billing.')}</Tabs.Content>
    </Tabs>
  ),
};

export const ButtonGray: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List type="button-gray">
        <Tabs.Trigger id="day" label="Day" />
        <Tabs.Trigger id="week" label="Week" />
        <Tabs.Trigger id="month" label="Month" />
        <Tabs.Trigger id="year" label="Year" />
      </Tabs.List>
      <Tabs.Content id="day">{samplePanel('Day view.')}</Tabs.Content>
      <Tabs.Content id="week">{samplePanel('Week view.')}</Tabs.Content>
      <Tabs.Content id="month">{samplePanel('Month view.')}</Tabs.Content>
      <Tabs.Content id="year">{samplePanel('Year view.')}</Tabs.Content>
    </Tabs>
  ),
  args: { defaultSelectedKey: 'day' },
};

export const WithIcons: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List type="button-brand">
        <Tabs.Trigger id="home" label="Home" icon={storybookIcons.user} />
        <Tabs.Trigger id="settings" label="Settings" icon={storybookIcons.settings} />
        <Tabs.Trigger id="bell" label="Notifications" icon={storybookIcons.bell} />
      </Tabs.List>
      <Tabs.Content id="home">{samplePanel('Home.')}</Tabs.Content>
      <Tabs.Content id="settings">{samplePanel('Settings.')}</Tabs.Content>
      <Tabs.Content id="bell">{samplePanel('Notifications.')}</Tabs.Content>
    </Tabs>
  ),
  args: { defaultSelectedKey: 'home' },
};

export const WithBadges: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List type="button-brand">
        <Tabs.Trigger id="inbox" label="Inbox" badge={12} />
        <Tabs.Trigger id="archive" label="Archive" badge={3} />
        <Tabs.Trigger id="spam" label="Spam" />
      </Tabs.List>
      <Tabs.Content id="inbox">{samplePanel('Inbox (12).')}</Tabs.Content>
      <Tabs.Content id="archive">{samplePanel('Archive (3).')}</Tabs.Content>
      <Tabs.Content id="spam">{samplePanel('Spam.')}</Tabs.Content>
    </Tabs>
  ),
  args: { defaultSelectedKey: 'inbox' },
};

export const DisabledTab: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List type="button-brand">
        <Tabs.Trigger id="active" label="Active" />
        <Tabs.Trigger id="paused" label="Paused" isDisabled />
        <Tabs.Trigger id="archived" label="Archived" />
      </Tabs.List>
      <Tabs.Content id="active">{samplePanel('Active items.')}</Tabs.Content>
      <Tabs.Content id="paused">{samplePanel('Paused items.')}</Tabs.Content>
      <Tabs.Content id="archived">{samplePanel('Archived items.')}</Tabs.Content>
    </Tabs>
  ),
  args: { defaultSelectedKey: 'active' },
};

export const Vertical: Story = {
  args: { orientation: 'vertical', defaultSelectedKey: 'profile' },
  render: (args) => (
    <Tabs {...args}>
      <div style={{ display: 'flex', gap: 24 }}>
        <Tabs.List type="line">
          <Tabs.Trigger id="profile" label="Profile" />
          <Tabs.Trigger id="security" label="Security" />
          <Tabs.Trigger id="notifications" label="Notifications" />
          <Tabs.Trigger id="billing" label="Billing" />
        </Tabs.List>
        <div style={{ flex: 1 }}>
          <Tabs.Content id="profile">{samplePanel('Profile settings.')}</Tabs.Content>
          <Tabs.Content id="security">{samplePanel('Security settings.')}</Tabs.Content>
          <Tabs.Content id="notifications">{samplePanel('Notification preferences.')}</Tabs.Content>
          <Tabs.Content id="billing">{samplePanel('Billing details.')}</Tabs.Content>
        </div>
      </div>
    </Tabs>
  ),
};

export const ManyTabs: Story = {
  args: { defaultSelectedKey: 'tab-1' },
  render: (args) => (
    <Tabs {...args}>
      <div style={{ overflowX: 'auto' }}>
        <Tabs.List type="underline">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <Tabs.Trigger key={n} id={`tab-${n.toString()}`} label={`Tab ${n.toString()}`} />
          ))}
        </Tabs.List>
      </div>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <Tabs.Content key={n} id={`tab-${n.toString()}`}>
          {samplePanel(`Content for tab ${n.toString()}.`)}
        </Tabs.Content>
      ))}
    </Tabs>
  ),
};
