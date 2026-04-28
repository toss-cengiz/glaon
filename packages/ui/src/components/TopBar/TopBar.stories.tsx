import type { ComponentType, HTMLAttributes } from 'react';

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Input } from '../Input';
import { storybookIcons } from '../../icons/storybook';
import { TopBar } from './TopBar';
import { topBarControls, topBarExcludeFromArgs } from './TopBar.controls';

// Same workaround as in `Input.stories.tsx` — the kit's `Input.icon`
// is typed `ComponentType<HTMLAttributes<...>>` while our shared
// picker (`icons/storybook.ts`) is typed loosely as
// `FC<any> | undefined`. Cast once for the WithSearch story.
type InputIcon = ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
const inputIcon = (name: keyof typeof storybookIcons): InputIcon =>
  storybookIcons[name] as InputIcon;

const { args, argTypes } = defineControls(topBarControls);

// Explicit `Meta<typeof TopBar>` annotation (rather than `satisfies`)
// keeps the merged static-property type out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `TopBar.controls.ts`;
// `tags: ['autodocs']` removed because `TopBar.mdx` replaces the
// docs tab.
const meta: Meta<typeof TopBar> = {
  title: 'Web Primitives/TopBar',
  component: TopBar,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-topbar',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div style={{ width: 1024 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TopBar>;

export const excludeFromArgs = topBarExcludeFromArgs;

const SampleBrand = () => <span className="text-base font-semibold text-primary">Glaon</span>;

const navLinkClass =
  'rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-primary_hover hover:text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2';

export const Default: Story = {
  render: (args) => (
    <TopBar {...args}>
      <TopBar.Brand>
        <SampleBrand />
      </TopBar.Brand>
      <TopBar.Nav>
        <a href="#" className={navLinkClass}>
          Devices
        </a>
        <a href="#" className={navLinkClass}>
          Scenes
        </a>
        <a href="#" className={navLinkClass}>
          Automations
        </a>
      </TopBar.Nav>
      <TopBar.Actions>
        <Button color="secondary" size="sm">
          Sign in
        </Button>
      </TopBar.Actions>
    </TopBar>
  ),
};

export const WithUserMenu: Story = {
  render: (args) => (
    <TopBar {...args}>
      <TopBar.Brand>
        <SampleBrand />
      </TopBar.Brand>
      <TopBar.Nav>
        <a href="#" className={navLinkClass}>
          Devices
        </a>
        <a href="#" className={navLinkClass}>
          Scenes
        </a>
      </TopBar.Nav>
      <TopBar.Actions>
        <Button
          color="tertiary"
          size="sm"
          iconLeading={storybookIcons.bell}
          aria-label="Notifications"
        />
        <Avatar
          size="sm"
          src="https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80"
          alt="Olivia Rhye"
        />
      </TopBar.Actions>
    </TopBar>
  ),
};

export const WithSearch: Story = {
  render: (args) => (
    <TopBar {...args}>
      <TopBar.Brand>
        <SampleBrand />
      </TopBar.Brand>
      <TopBar.Nav>
        <a href="#" className={navLinkClass}>
          Devices
        </a>
        <a href="#" className={navLinkClass}>
          Scenes
        </a>
      </TopBar.Nav>
      <TopBar.Actions>
        <div style={{ width: 280 }}>
          <Input
            aria-label="Search"
            placeholder="Search devices…"
            size="sm"
            icon={inputIcon('search')}
          />
        </div>
        <Avatar size="sm" alt="Olivia Rhye" initials="OR" />
      </TopBar.Actions>
    </TopBar>
  ),
};

export const Compact: Story = {
  args: { compact: true },
  render: (args) => (
    <TopBar {...args}>
      <TopBar.Brand>
        <SampleBrand />
      </TopBar.Brand>
      <TopBar.Nav>
        <a href="#" className={navLinkClass}>
          Devices
        </a>
        <a href="#" className={navLinkClass}>
          Scenes
        </a>
      </TopBar.Nav>
      <TopBar.Actions>
        <Avatar size="xs" alt="Olivia Rhye" initials="OR" />
      </TopBar.Actions>
    </TopBar>
  ),
};

export const BrandOnly: Story = {
  render: (args) => (
    <TopBar {...args}>
      <TopBar.Brand>
        <SampleBrand />
      </TopBar.Brand>
      <TopBar.Actions>
        <Button color="secondary" size="sm">
          Sign in
        </Button>
      </TopBar.Actions>
    </TopBar>
  ),
};
