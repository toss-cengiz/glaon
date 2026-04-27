import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { storybookIcons } from '../../icons/storybook';
import { Breadcrumb } from './Breadcrumb';

// Explicit `Meta<typeof Breadcrumb>` annotation (rather than
// `satisfies`) keeps the kit's deep RAC generic chains out of the
// exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
const meta: Meta<typeof Breadcrumb> = {
  title: 'Web Primitives/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-breadcrumb',
    },
  },
  args: {
    type: 'text',
    divider: 'chevron',
    maxVisibleItems: 4,
  },
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['text', 'text-line', 'button'],
    },
    divider: { control: 'inline-radio', options: ['chevron', 'slash'] },
    maxVisibleItems: { control: { type: 'number', min: 2, max: 10, step: 1 } },
    children: { control: false, table: { disable: true } },
    className: { control: false, table: { disable: true } },
    // BreadcrumbItem-only props surfaced on the Breadcrumb namespace
    // through the static-property pattern; consumers set these on
    // `<Breadcrumb.Item …>`, not the root.
    href: { control: false, table: { disable: true } },
    icon: { control: false, table: { disable: true } },
    isEllipsis: { control: false, table: { disable: true } },
    avatarSrc: { control: false, table: { disable: true } },
    onClick: { control: false, table: { disable: true } },
  },
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

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['text', 'text-line', 'button'] as const).map((type) => (
        <Breadcrumb key={type} type={type}>
          <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
          <Breadcrumb.Item href="/projects">Projects</Breadcrumb.Item>
          <Breadcrumb.Item>{`type: ${type}`}</Breadcrumb.Item>
        </Breadcrumb>
      ))}
    </div>
  ),
};
