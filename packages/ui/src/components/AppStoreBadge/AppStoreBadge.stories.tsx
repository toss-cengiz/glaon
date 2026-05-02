import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { AppStoreBadge, type AppStore } from './AppStoreBadge';
import { appStoreBadgeControls, appStoreBadgeExcludeFromArgs } from './AppStoreBadge.controls';

const { args, argTypes } = defineControls(appStoreBadgeControls);

// Explicit `Meta<typeof AppStoreBadge>` annotation (rather than
// `satisfies`) keeps the unexported `AppStoreBadgeProps` interface
// out of the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true` and TS4023 fires when an exported `meta`
// resolves to a non-exported nominal type.
const meta: Meta<typeof AppStoreBadge> = {
  title: 'Web Primitives/AppStoreBadge',
  component: AppStoreBadge,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-app-store-badge',
    },
  },
  args,
  argTypes,
};

export default meta;
type Story = StoryObj<typeof AppStoreBadge>;

export const excludeFromArgs = appStoreBadgeExcludeFromArgs;

export const Default: Story = {};

export const MacAppStore: Story = {
  args: { store: 'mac-app-store' },
};

export const GooglePlay: Story = {
  args: { store: 'google-play' },
};

export const GalaxyStore: Story = {
  args: { store: 'galaxy-store' },
};

export const AppGallery: Story = {
  args: { store: 'app-gallery' },
};

export const Light: Story = {
  args: { store: 'app-store', theme: 'light' },
  decorators: [
    (Story) => (
      <div className="flex h-20 items-center bg-utility-neutral-900 p-4">
        <Story />
      </div>
    ),
  ],
};

export const AsLink: Story = {
  args: { store: 'app-store', href: '#' },
};

const STORES: AppStore[] = [
  'app-store',
  'mac-app-store',
  'google-play',
  'galaxy-store',
  'app-gallery',
];

// Matrix story: iterates `store` and renders all 5 platforms in a
// single canvas. Other props still flow through `{...args}`.
export const Stores: Story = {
  parameters: { controls: { exclude: ['store'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {STORES.map((store) => (
        <AppStoreBadge key={store} {...args} store={store} />
      ))}
    </div>
  ),
};

// Matrix story: iterates `theme` (dark / light) on a paired set of
// page backgrounds so the contrast difference is visible.
export const Themes: Story = {
  parameters: { controls: { exclude: ['theme'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="flex items-center gap-3 bg-secondary p-4">
        <span className="min-w-32 text-xs text-tertiary">theme: dark</span>
        <AppStoreBadge {...args} theme="dark" />
      </div>
      <div className="flex items-center gap-3 bg-utility-neutral-900 p-4">
        <span className="min-w-32 text-xs text-white">theme: light</span>
        <AppStoreBadge {...args} theme="light" />
      </div>
    </div>
  ),
};
