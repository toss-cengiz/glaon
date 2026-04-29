import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Button } from '../Button';
import { Banner } from './Banner';
import { bannerControls, bannerExcludeFromArgs } from './Banner.controls';

const { args, argTypes } = defineControls(bannerControls);

// Explicit `Meta<typeof Banner>` annotation (rather than `satisfies`)
// keeps storybook csf-internal types out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true` and trips
// TS2742 / TS4023 when the inferred meta references types that aren't
// portably named.
//
// Phase 1.5: `args` + `argTypes` come from `Banner.controls.ts`;
// `tags: ['autodocs']` removed because `Banner.mdx` replaces the
// docs tab.
const meta: Meta<typeof Banner> = {
  title: 'Web Primitives/Banner',
  component: Banner,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-banner',
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
type Story = StoryObj<typeof Banner>;

export const excludeFromArgs = bannerExcludeFromArgs;

export const Default: Story = {};

export const Info: Story = {
  args: {
    intent: 'info',
    title: 'New feature live',
    description: 'Try it from the dashboard.',
  },
};

export const Success: Story = {
  args: {
    intent: 'success',
    title: 'Backup complete',
    description: 'All data restored.',
  },
};

export const Warning: Story = {
  args: {
    intent: 'warning',
    title: 'Maintenance window tonight',
    description: '02:00 – 04:00 UTC.',
  },
};

export const Danger: Story = {
  args: {
    intent: 'danger',
    title: 'Connection lost',
    description: 'Reconnecting…',
  },
};

export const Dismissible: Story = {
  args: { dismissible: true },
};

export const WithActions: Story = {
  args: {
    title: 'We use third-party cookies',
    description: 'Read our cookie policy.',
    actions: (
      <>
        <Button color="secondary" size="sm">
          Decline
        </Button>
        <Button color="primary" size="sm">
          Allow
        </Button>
      </>
    ),
  },
};

export const WithActionsDismissible: Story = {
  args: {
    title: 'Update available',
    description: 'A new version is ready to install.',
    dismissible: true,
    actions: (
      <>
        <Button color="secondary" size="sm">
          Later
        </Button>
        <Button color="primary" size="sm">
          Update
        </Button>
      </>
    ),
  },
};

// Matrix story: iterates `intent` and renders every variant in a
// single canvas, so the controls panel hides `intent`. Other props
// still flow through `{...args}`.
export const Intents: Story = {
  parameters: { controls: { exclude: ['intent'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['info', 'success', 'warning', 'danger'] as const).map((intent) => (
        <Banner key={intent} {...args} intent={intent} title={`Intent: ${intent}`} />
      ))}
    </div>
  ),
};
