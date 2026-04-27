import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import type { FC } from 'react';

import { Avatar } from '../Avatar';
import { storybookIcons } from '../../icons/storybook';
import { SideNav } from './SideNav';

// Pull a few icons from the curated picker so stories share the
// same icon-typing workaround as Button / Alert / TopBar etc. The
// picker types entries as `IconComponent | undefined` (so its `none`
// option resolves to `undefined`), but `SideNav.Item.icon` requires
// non-undefined under `exactOptionalPropertyTypes`. Cast through a
// helper so stories stay readable.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
const icon = (key: keyof typeof storybookIcons): FC<any> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
  storybookIcons[key] as FC<any>;

const bell = icon('bell');
const heart = icon('heart');
const settings = icon('settings');
const star = icon('star');
const user = icon('user');

// Explicit `Meta<typeof SideNav>` annotation (rather than `satisfies`)
// keeps the merged static-property shape out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true`.
const meta: Meta<typeof SideNav> = {
  title: 'Web Primitives/SideNav',
  component: SideNav,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-sidenav',
    },
  },
  args: {
    collapsed: false,
  },
  argTypes: {
    collapsed: { control: 'boolean' },
    children: { control: false, table: { disable: true } },
    className: { control: false, table: { disable: true } },
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: 560 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SideNav>;

const SampleBrand = () => <span className="text-base font-semibold text-primary">Glaon</span>;

export const Default: Story = {
  render: (args) => (
    <SideNav {...args}>
      <SideNav.Brand>
        <SampleBrand />
      </SideNav.Brand>
      <SideNav.Group>
        <SideNav.Item label="Devices" icon={user} href="#" current />
        <SideNav.Item label="Scenes" icon={star} href="#" />
        <SideNav.Item label="Favorites" icon={heart} href="#" />
        <SideNav.Item label="Notifications" icon={bell} href="#" />
      </SideNav.Group>
      <SideNav.Footer>
        <SideNav.Item label="Settings" icon={settings} href="#" />
        <SideNav.Item label="Profile" icon={user} href="#" />
      </SideNav.Footer>
    </SideNav>
  ),
};

export const Collapsed: Story = {
  args: { collapsed: true },
  render: (args) => (
    <SideNav {...args}>
      <SideNav.Brand>
        <span className="text-base font-semibold text-primary">G</span>
      </SideNav.Brand>
      <SideNav.Group>
        <SideNav.Item label="Devices" icon={user} href="#" current />
        <SideNav.Item label="Scenes" icon={star} href="#" />
        <SideNav.Item label="Notifications" icon={bell} href="#" />
      </SideNav.Group>
      <SideNav.Footer>
        <SideNav.Item label="Settings" icon={settings} href="#" />
      </SideNav.Footer>
    </SideNav>
  ),
};

export const WithGroups: Story = {
  render: (args) => (
    <SideNav {...args}>
      <SideNav.Brand>
        <SampleBrand />
      </SideNav.Brand>
      <SideNav.Group label="Workspace">
        <SideNav.Item label="Devices" icon={user} href="#" current />
        <SideNav.Item label="Scenes" icon={star} href="#" />
      </SideNav.Group>
      <SideNav.Group label="Activity">
        <SideNav.Item label="Notifications" icon={bell} href="#" />
        <SideNav.Item label="Favorites" icon={heart} href="#" />
      </SideNav.Group>
      <SideNav.Footer>
        <SideNav.Item label="Settings" icon={settings} href="#" />
      </SideNav.Footer>
    </SideNav>
  ),
};

export const WithBadges: Story = {
  render: (args) => (
    <SideNav {...args}>
      <SideNav.Brand>
        <SampleBrand />
      </SideNav.Brand>
      <SideNav.Group>
        <SideNav.Item label="Devices" icon={user} href="#" current badge={12} />
        <SideNav.Item label="Notifications" icon={bell} href="#" badge={3} />
        <SideNav.Item label="Scenes" icon={star} href="#" />
        <SideNav.Item label="Favorites" icon={heart} href="#" badge="New" />
      </SideNav.Group>
      <SideNav.Footer>
        <SideNav.Item label="Settings" icon={settings} href="#" />
      </SideNav.Footer>
    </SideNav>
  ),
};

export const WithFooterUserSection: Story = {
  render: (args) => (
    <SideNav {...args}>
      <SideNav.Brand>
        <SampleBrand />
      </SideNav.Brand>
      <SideNav.Group>
        <SideNav.Item label="Devices" icon={user} href="#" current />
        <SideNav.Item label="Scenes" icon={star} href="#" />
      </SideNav.Group>
      <SideNav.Footer>
        <div className="flex items-center gap-3 rounded-md border border-secondary_alt p-3">
          <Avatar size="sm" alt="Olivia Rhye" initials="OR" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-primary">Olivia Rhye</span>
            <span className="truncate text-xs text-tertiary">olivia@glaon.app</span>
          </div>
        </div>
      </SideNav.Footer>
    </SideNav>
  ),
};
