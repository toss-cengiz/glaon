import type { FC } from 'react';

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Eye, LogOut01, Settings01, User01 } from '@untitledui/icons';
import { Button as AriaButton } from 'react-aria-components';

import { defineControls } from '../_internal/controls';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Dropdown } from './Dropdown';
import { dropdownControls, dropdownExcludeFromArgs } from './Dropdown.controls';

const { args, argTypes } = defineControls(dropdownControls);

// Cast `@untitledui/icons` exports to the kit's narrower
// `FC<{ className?: string }>` shape — same workaround as
// `icons/storybook.ts`. Per-icon Props interfaces aren't re-exported
// from the package so direct typing trips TS4023.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type IconComponent = FC<any>;
const eyeIcon = Eye as IconComponent;
const settingsIcon = Settings01 as IconComponent;
const userIcon = User01 as IconComponent;
const logOutIcon = LogOut01 as IconComponent;

// Explicit `Meta<typeof Dropdown>` annotation (rather than
// `satisfies`) keeps the kit's deep RAC `MenuTrigger` generic chains
// out of the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
const meta: Meta<typeof Dropdown> = {
  title: 'Web Primitives/Dropdown',
  component: Dropdown,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-dropdown',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          height: 360,
          padding: 24,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

export const excludeFromArgs = dropdownExcludeFromArgs;

export const Default: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button color="secondary">Options</Button>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Item label="View profile" />
          <Dropdown.Item label="Settings" />
          <Dropdown.Item label="Keyboard shortcuts" />
          <Dropdown.Separator />
          <Dropdown.Item label="Sign out" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

export const WithIcons: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button color="secondary">Account</Button>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Item icon={eyeIcon} label="View profile" />
          <Dropdown.Item icon={settingsIcon} label="Settings" />
          <Dropdown.Item icon={userIcon} label="Switch account" />
          <Dropdown.Separator />
          <Dropdown.Item icon={logOutIcon} label="Sign out" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

export const WithAddons: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button color="secondary">Quick actions</Button>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Item icon={eyeIcon} label="View profile" addon="⌘P" />
          <Dropdown.Item icon={settingsIcon} label="Settings" addon="⌘," />
          <Dropdown.Item icon={userIcon} label="Switch account" addon="⌘⇧A" />
          <Dropdown.Separator />
          <Dropdown.Item icon={logOutIcon} label="Sign out" addon="⌘⇧Q" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

const oliviaUrl = 'https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80';
const phoenixUrl = 'https://www.untitledui.com/images/avatars/phoenix-baker?fm=webp&q=80';
const lanaUrl = 'https://www.untitledui.com/images/avatars/lana-steiner?fm=webp&q=80';

export const WithAvatars: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button color="secondary">Assignee</Button>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Item avatarUrl={oliviaUrl} label="Olivia Rhye" />
          <Dropdown.Item avatarUrl={phoenixUrl} label="Phoenix Baker" />
          <Dropdown.Item avatarUrl={lanaUrl} label="Lana Steiner" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

export const WithSelectionCheckmark: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button color="secondary">Sort by</Button>
      <Dropdown.Popover>
        <Dropdown.Menu selectionMode="single" defaultSelectedKeys={['name']}>
          <Dropdown.Item id="name" label="Name" selectionIndicator="checkmark" />
          <Dropdown.Item id="updated" label="Last updated" selectionIndicator="checkmark" />
          <Dropdown.Item id="created" label="Date created" selectionIndicator="checkmark" />
          <Dropdown.Item id="size" label="Size" selectionIndicator="checkmark" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

export const WithSelectionCheckbox: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button color="secondary">Filter</Button>
      <Dropdown.Popover>
        <Dropdown.Menu selectionMode="multiple" defaultSelectedKeys={['active', 'archived']}>
          <Dropdown.Item id="active" label="Active" selectionIndicator="checkbox" />
          <Dropdown.Item id="draft" label="Draft" selectionIndicator="checkbox" />
          <Dropdown.Item id="archived" label="Archived" selectionIndicator="checkbox" />
          <Dropdown.Item id="deleted" label="Deleted" selectionIndicator="checkbox" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

export const WithSelectionRadio: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button color="secondary">Theme</Button>
      <Dropdown.Popover>
        <Dropdown.Menu selectionMode="single" defaultSelectedKeys={['system']}>
          <Dropdown.Item id="light" label="Light" selectionIndicator="radio" />
          <Dropdown.Item id="dark" label="Dark" selectionIndicator="radio" />
          <Dropdown.Item id="system" label="Match system" selectionIndicator="radio" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

export const WithSelectionToggle: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button color="secondary">View options</Button>
      <Dropdown.Popover>
        <Dropdown.Menu selectionMode="multiple" defaultSelectedKeys={['auto-refresh']}>
          <Dropdown.Item id="auto-refresh" label="Auto-refresh" selectionIndicator="toggle" />
          <Dropdown.Item id="archived" label="Show archived" selectionIndicator="toggle" />
          <Dropdown.Item id="diff" label="Inline diff" selectionIndicator="toggle" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

export const WithSections: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button color="secondary">Workspace</Button>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Section>
            <Dropdown.SectionHeader className="px-3 pt-2 pb-1 text-xs font-semibold text-tertiary uppercase">
              Account
            </Dropdown.SectionHeader>
            <Dropdown.Item icon={eyeIcon} label="View profile" />
            <Dropdown.Item icon={settingsIcon} label="Settings" />
          </Dropdown.Section>
          <Dropdown.Separator />
          <Dropdown.Section>
            <Dropdown.SectionHeader className="px-3 pt-2 pb-1 text-xs font-semibold text-tertiary uppercase">
              Team
            </Dropdown.SectionHeader>
            <Dropdown.Item icon={userIcon} label="Invite colleagues" />
            <Dropdown.Item icon={settingsIcon} label="Manage members" />
          </Dropdown.Section>
          <Dropdown.Separator />
          <Dropdown.Item icon={logOutIcon} label="Sign out" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

export const WithDividers: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button color="secondary">Mixed</Button>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Item icon={eyeIcon} label="View profile" />
          <Dropdown.Separator />
          <Dropdown.Item icon={settingsIcon} label="Settings" />
          <Dropdown.Item icon={userIcon} label="Team members" />
          <Dropdown.Separator />
          <Dropdown.Item icon={logOutIcon} label="Sign out" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

export const WithAvatarGroupHeader: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <AriaButton
        aria-label="User menu for Olivia Rhye"
        className="rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Avatar src={oliviaUrl} alt="Olivia Rhye" size="sm" />
      </AriaButton>
      <Dropdown.Popover>
        <Dropdown.Menu>
          {/* RAC `<Header>` (SectionHeader) must live inside a
              `<Section>` so axe `aria-required-children` accepts it
              under the `role="menu"` parent. Without the Section
              wrapper, axe flags `header[tabindex]` as a non-allowed
              child of `role="menu"`. */}
          <Dropdown.Section>
            <Dropdown.SectionHeader className="block px-3 pt-3 pb-2">
              <div className="flex items-center gap-3">
                <Avatar src={oliviaUrl} alt="Olivia Rhye" size="sm" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-primary">Olivia Rhye</span>
                  <span className="truncate text-xs text-tertiary">olivia@untitledui.com</span>
                </div>
              </div>
            </Dropdown.SectionHeader>
          </Dropdown.Section>
          <Dropdown.Separator />
          <Dropdown.Item icon={eyeIcon} label="View profile" />
          <Dropdown.Item icon={settingsIcon} label="Settings" />
          <Dropdown.Item icon={userIcon} label="Switch account" />
          <Dropdown.Separator />
          <Dropdown.Item icon={logOutIcon} label="Sign out" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

export const IconTrigger: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Dropdown.DotsButton aria-label="More actions" />
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Item icon={eyeIcon} label="View" />
          <Dropdown.Item icon={settingsIcon} label="Edit" />
          <Dropdown.Separator />
          <Dropdown.Item icon={logOutIcon} label="Delete" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

// `<MenuTrigger>` (Dropdown root) needs a press-aware child to bind
// the open/close handlers — a plain `<button>` or `<Avatar>` won't
// activate the menu. Wrap the avatar in RAC's `<AriaButton>` so the
// trigger contract works without forcing the Glaon `<Button>` chrome
// (padding / ring / shadow) on the avatar visual.
export const AvatarTrigger: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <AriaButton
        aria-label="User menu for Olivia Rhye"
        className="rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Avatar src={oliviaUrl} alt="Olivia Rhye" size="md" />
      </AriaButton>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <Dropdown.Item icon={eyeIcon} label="View profile" />
          <Dropdown.Item icon={settingsIcon} label="Settings" />
          <Dropdown.Separator />
          <Dropdown.Item icon={logOutIcon} label="Sign out" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

export const DisabledItem: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button color="secondary">With disabled</Button>
      <Dropdown.Popover>
        <Dropdown.Menu disabledKeys={['archived']}>
          <Dropdown.Item id="active" icon={eyeIcon} label="View profile" />
          <Dropdown.Item id="settings" icon={settingsIcon} label="Settings" />
          <Dropdown.Item id="archived" icon={userIcon} label="Archived (coming soon)" />
          <Dropdown.Separator />
          <Dropdown.Item id="logout" icon={logOutIcon} label="Sign out" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};

// `OpenState` is the single story that renders with the popover
// already open — it carries the canonical menu (avatar header +
// sectioned items) so Chromatic's open-popover snapshot covers the
// rich content. All other stories render the closed trigger only;
// users click in the Storybook canvas to interact. See #316 for
// the rationale (auto-open across all stories breaks the MDX docs
// page when every overlay opens at once).
export const OpenState: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Dropdown {...args}>
      <AriaButton
        aria-label="User menu for Olivia Rhye"
        className="rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Avatar src={oliviaUrl} alt="Olivia Rhye" size="sm" />
      </AriaButton>
      <Dropdown.Popover>
        <Dropdown.Menu>
          {/* RAC `<Header>` (SectionHeader) must live inside a
              `<Section>` for axe `aria-required-children` (see
              WithAvatarGroupHeader story for the same fix). */}
          <Dropdown.Section>
            <Dropdown.SectionHeader className="block px-3 pt-3 pb-2">
              <div className="flex items-center gap-3">
                <Avatar src={oliviaUrl} alt="Olivia Rhye" size="sm" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-primary">Olivia Rhye</span>
                  <span className="truncate text-xs text-tertiary">olivia@untitledui.com</span>
                </div>
              </div>
            </Dropdown.SectionHeader>
          </Dropdown.Section>
          <Dropdown.Separator />
          <Dropdown.Item icon={eyeIcon} label="View profile" addon="⌘P" />
          <Dropdown.Item icon={settingsIcon} label="Settings" addon="⌘," />
          <Dropdown.Item icon={userIcon} label="Switch account" />
          <Dropdown.Separator />
          <Dropdown.Item icon={logOutIcon} label="Sign out" />
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  ),
};
