import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';
import { Breadcrumb } from './Breadcrumb';
import { breadcrumbControls, breadcrumbExcludeFromArgs } from './Breadcrumb.controls';

const { args, argTypes } = defineControls(breadcrumbControls);

// Explicit `Meta<typeof Breadcrumb>` annotation (rather than
// `satisfies`) keeps the kit's deep RAC generic chains out of the
// exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Breadcrumb.controls.ts`;
// `tags: ['autodocs']` removed because `Breadcrumb.mdx` replaces the
// docs tab.
const meta: Meta<typeof Breadcrumb> = {
  title: 'Web Primitives/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-breadcrumb',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div style={{ width: 720 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const excludeFromArgs = breadcrumbExcludeFromArgs;

export const Default: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/projects">Projects</Breadcrumb.Item>
      <Breadcrumb.Item>Glaon</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

export const WithSlashDivider: Story = {
  args: { divider: 'slash' },
  render: (args) => (
    <Breadcrumb {...args}>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/projects">Projects</Breadcrumb.Item>
      <Breadcrumb.Item>Glaon</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

export const TextLine: Story = {
  args: { type: 'text-line' },
  render: (args) => (
    <Breadcrumb {...args}>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/projects">Projects</Breadcrumb.Item>
      <Breadcrumb.Item>Glaon</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

export const Button: Story = {
  args: { type: 'button' },
  render: (args) => (
    <Breadcrumb {...args}>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/projects">Projects</Breadcrumb.Item>
      <Breadcrumb.Item>Glaon</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

export const WithIcons: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <Breadcrumb.Item href="/" icon={storybookIcons.user}>
        Home
      </Breadcrumb.Item>
      <Breadcrumb.Item href="/settings" icon={storybookIcons.settings}>
        Settings
      </Breadcrumb.Item>
      <Breadcrumb.Item icon={storybookIcons.bell}>Notifications</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

export const Truncated: Story = {
  args: { maxVisibleItems: 3 },
  render: (args) => (
    <Breadcrumb {...args}>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/workspace">Workspace</Breadcrumb.Item>
      <Breadcrumb.Item href="/workspace/projects">Projects</Breadcrumb.Item>
      <Breadcrumb.Item href="/workspace/projects/glaon">Glaon</Breadcrumb.Item>
      <Breadcrumb.Item href="/workspace/projects/glaon/issues">Issues</Breadcrumb.Item>
      <Breadcrumb.Item>#184</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

export const SingleLevel: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

// (No `Variants` gallery story — rendering three `<Breadcrumb>` side
// by side puts three `<nav aria-label="Breadcrumbs">` landmarks on
// the same page, which trips axe `landmark-unique`. Variants are
// already covered individually by Default / TextLine / Button.)
