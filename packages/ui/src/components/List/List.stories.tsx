import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Checkbox } from '../Checkbox';
import { storybookIcons } from '../../icons/storybook';
import { List } from './List';

const Bell = storybookIcons.bell;
const Settings = storybookIcons.settings;
const Star = storybookIcons.star;
const User = storybookIcons.user;

// Explicit `Meta<typeof List>` annotation (rather than `satisfies`)
// keeps the merged static-property type out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true`.
const meta: Meta<typeof List> = {
  title: 'Web Primitives/List',
  component: List,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-list',
    },
  },
  args: {
    dividers: false,
    bordered: false,
  },
  argTypes: {
    dividers: { control: 'boolean' },
    bordered: { control: 'boolean' },
    emptyState: { control: false, table: { disable: true } },
    children: { control: false, table: { disable: true } },
    className: { control: false, table: { disable: true } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof List>;

export const Default: Story = {
  render: (args) => (
    <List {...args}>
      <List.Item>Living room thermostat</List.Item>
      <List.Item>Kitchen light strip</List.Item>
      <List.Item>Front door camera</List.Item>
      <List.Item>Bedroom blinds</List.Item>
    </List>
  ),
};

export const Bordered: Story = {
  args: { bordered: true, dividers: true },
  render: (args) => (
    <List {...args}>
      <List.Item>Living room thermostat</List.Item>
      <List.Item>Kitchen light strip</List.Item>
      <List.Item>Front door camera</List.Item>
      <List.Item>Bedroom blinds</List.Item>
    </List>
  ),
};

export const WithDividers: Story = {
  args: { dividers: true },
  render: (args) => (
    <List {...args}>
      <List.Item>Privacy & sharing</List.Item>
      <List.Item>Notifications</List.Item>
      <List.Item>Display & accessibility</List.Item>
      <List.Item>Account</List.Item>
    </List>
  ),
};

export const WithLeadingIcon: Story = {
  args: { dividers: true, bordered: true },
  render: (args) => (
    <List {...args}>
      <List.Item leading={Bell !== undefined ? <Bell className="size-5" /> : null}>
        Notifications
      </List.Item>
      <List.Item leading={User !== undefined ? <User className="size-5" /> : null}>
        Account
      </List.Item>
      <List.Item leading={Settings !== undefined ? <Settings className="size-5" /> : null}>
        Preferences
      </List.Item>
      <List.Item leading={Star !== undefined ? <Star className="size-5" /> : null}>
        Favourites
      </List.Item>
    </List>
  ),
};

export const WithAvatar: Story = {
  args: { dividers: true, bordered: true },
  render: (args) => (
    <List {...args}>
      <List.Item leading={<Avatar size="sm" alt="Olivia" initials="OR" />}>
        <span className="font-semibold text-primary">Olivia Rhye</span>
        <span className="text-tertiary">olivia@glaon.app</span>
      </List.Item>
      <List.Item leading={<Avatar size="sm" alt="Phoenix" initials="PB" />}>
        <span className="font-semibold text-primary">Phoenix Baker</span>
        <span className="text-tertiary">phoenix@glaon.app</span>
      </List.Item>
      <List.Item leading={<Avatar size="sm" alt="Lana" initials="LS" />}>
        <span className="font-semibold text-primary">Lana Steiner</span>
        <span className="text-tertiary">lana@glaon.app</span>
      </List.Item>
    </List>
  ),
};

export const WithActions: Story = {
  args: { dividers: true, bordered: true },
  render: (args) => (
    <List {...args}>
      <List.Item
        trailing={
          <List.ItemAction
            onClick={() => {
              /* edit */
            }}
          >
            Edit
          </List.ItemAction>
        }
      >
        Living room thermostat
      </List.Item>
      <List.Item
        trailing={
          <List.ItemAction
            onClick={() => {
              /* edit */
            }}
          >
            Edit
          </List.ItemAction>
        }
      >
        Kitchen light strip
      </List.Item>
      <List.Item
        trailing={
          <List.ItemAction
            onClick={() => {
              /* edit */
            }}
          >
            Edit
          </List.ItemAction>
        }
      >
        Front door camera
      </List.Item>
    </List>
  ),
};

export const WithBadges: Story = {
  args: { dividers: true, bordered: true },
  render: (args) => (
    <List {...args}>
      <List.Item trailing={<Badge color="success">Online</Badge>}>Living room thermostat</List.Item>
      <List.Item trailing={<Badge color="warning">Updating</Badge>}>Kitchen light strip</List.Item>
      <List.Item trailing={<Badge color="error">Offline</Badge>}>Front door camera</List.Item>
    </List>
  ),
};

export const Selectable: Story = {
  args: { dividers: true, bordered: true },
  render: (args) => (
    <List {...args}>
      <List.Item leading={<Checkbox aria-label="Living room thermostat" />}>
        Living room thermostat
      </List.Item>
      <List.Item leading={<Checkbox aria-label="Kitchen light strip" />}>
        Kitchen light strip
      </List.Item>
      <List.Item leading={<Checkbox aria-label="Front door camera" />}>Front door camera</List.Item>
      <List.Item leading={<Checkbox aria-label="Bedroom blinds" />}>Bedroom blinds</List.Item>
    </List>
  ),
};

export const Interactive: Story = {
  args: { dividers: true, bordered: true },
  render: (args) => (
    <List {...args}>
      <List.Item current onClick={() => undefined}>
        Devices
      </List.Item>
      <List.Item onClick={() => undefined}>Scenes</List.Item>
      <List.Item onClick={() => undefined}>Automations</List.Item>
      <List.Item onClick={() => undefined}>Settings</List.Item>
    </List>
  ),
};

export const Empty: Story = {
  args: { bordered: true },
  render: (args) => <List {...args} />,
};

export const EmptyCustom: Story = {
  args: {
    bordered: true,
    emptyState: (
      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
        <p className="text-base font-semibold text-primary">No devices yet</p>
        <p className="text-sm text-tertiary">Pair your first device to start automating.</p>
      </div>
    ),
  },
  render: (args) => <List {...args} />,
};
