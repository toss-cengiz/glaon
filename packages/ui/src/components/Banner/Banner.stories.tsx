import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Banner, type BannerTheme, type BannerType } from './Banner';
import { bannerControls, bannerExcludeFromArgs } from './Banner.controls';

const { args, argTypes } = defineControls(bannerControls);

// Explicit `Meta<typeof Banner>` annotation (rather than `satisfies`)
// keeps the unexported `BannerProps` interface out of the exported
// `meta` signature — `tsc --noEmit` runs with `declaration: true`
// and TS4023 fires when an exported `meta` resolves to a non-exported
// nominal type.
//
// #305: Banner is now a parametric primitive matching Figma's
// `web-primitives-banner` `Type` × `Theme` axes.
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
};

export default meta;
type Story = StoryObj<typeof Banner>;

export const excludeFromArgs = bannerExcludeFromArgs;

export const Default: Story = {
  args: {
    type: 'single-action',
    title: "We've just announced our Series A!",
    description: 'Read about it from our CEO.',
    primaryActionLabel: 'Read update',
    onPrimaryAction: () => undefined,
    onDismiss: () => undefined,
  },
};

export const TextField: Story = {
  args: {
    type: 'text-field',
    title: 'Stay up to date with the latest news and updates',
    description: 'Be the first to hear about new components, updates, and design resources.',
    inputPlaceholder: 'Enter your email',
    primaryActionLabel: 'Subscribe',
    onPrimaryAction: () => undefined,
    onDismiss: () => undefined,
  },
};

export const SingleAction: Story = {
  args: {
    type: 'single-action',
    title: "We've just announced our Series A!",
    description: 'Read about it from our CEO.',
    primaryActionLabel: 'Read update',
    onPrimaryAction: () => undefined,
    onDismiss: () => undefined,
  },
};

export const DualAction: Story = {
  args: {
    type: 'dual-action',
    title: 'We use third-party cookies in order to personalise your experience',
    description: (
      <>
        Read our{' '}
        <a
          href="#"
          className="rounded-xs underline decoration-utility-neutral-300 underline-offset-3 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Cookie Policy
        </a>
        .
      </>
    ),
    primaryActionLabel: 'Allow',
    onPrimaryAction: () => undefined,
    secondaryActionLabel: 'Decline',
    onSecondaryAction: () => undefined,
    onDismiss: () => undefined,
  },
};

export const Slim: Story = {
  args: {
    type: 'slim',
    title: "We've just launched a new feature!",
    description: (
      <>
        Check out the{' '}
        <a
          href="#"
          className="rounded-xs underline decoration-utility-neutral-300 underline-offset-3 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          new dashboard
        </a>
        .
      </>
    ),
    onDismiss: () => undefined,
  },
};

export const Brand: Story = {
  args: {
    theme: 'brand',
    type: 'single-action',
    title: "We've just announced our Series A!",
    description: 'Read about it from our CEO.',
    primaryActionLabel: 'Read update',
    onPrimaryAction: () => undefined,
    onDismiss: () => undefined,
  },
};

export const Persistent: Story = {
  args: {
    type: 'single-action',
    title: 'Update available',
    description: 'A newer version is ready to install.',
    primaryActionLabel: 'Install',
    onPrimaryAction: () => undefined,
    // No onDismiss → no close X → user must use the action button.
  },
};

// Matrix story: iterates `type` and renders every layout variant in
// one canvas. Other props still flow through `{...args}`.
const TYPES: BannerType[] = ['text-field', 'single-action', 'dual-action', 'slim'];

const SAMPLE: Record<BannerType, { title: string; description?: React.ReactNode }> = {
  'text-field': {
    title: 'Stay up to date with the latest news and updates',
    description: 'Be the first to hear about new components, updates, and design resources.',
  },
  'single-action': {
    title: "We've just announced our Series A!",
    description: 'Read about it from our CEO.',
  },
  'dual-action': {
    title: 'We use third-party cookies in order to personalise your experience',
    description: (
      <>
        Read our{' '}
        <a
          href="#"
          className="rounded-xs underline decoration-utility-neutral-300 underline-offset-3 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Cookie Policy
        </a>
        .
      </>
    ),
  },
  slim: {
    title: "We've just launched a new feature!",
    description: (
      <>
        Check out the{' '}
        <a
          href="#"
          className="rounded-xs underline decoration-utility-neutral-300 underline-offset-3 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          new dashboard
        </a>
        .
      </>
    ),
  },
};

const TYPE_PRIMARY: Record<BannerType, string> = {
  'text-field': 'Subscribe',
  'single-action': 'Read update',
  'dual-action': 'Allow',
  slim: '',
};

const TYPE_SECONDARY: Record<BannerType, string> = {
  'text-field': '',
  'single-action': '',
  'dual-action': 'Decline',
  slim: '',
};

export const Types: Story = {
  parameters: {
    controls: {
      exclude: [
        'type',
        'title',
        'description',
        'primaryActionLabel',
        'secondaryActionLabel',
        'inputPlaceholder',
      ],
    },
  },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {TYPES.map((type) => {
        const sample = SAMPLE[type];
        return (
          <Banner
            key={type}
            {...args}
            type={type}
            title={sample.title}
            description={sample.description}
            primaryActionLabel={TYPE_PRIMARY[type] || undefined}
            onPrimaryAction={TYPE_PRIMARY[type] ? () => undefined : undefined}
            secondaryActionLabel={TYPE_SECONDARY[type] || undefined}
            onSecondaryAction={TYPE_SECONDARY[type] ? () => undefined : undefined}
          />
        );
      })}
    </div>
  ),
};

// Matrix story: iterates `theme` (default + brand) using a
// `single-action` layout so the colour difference is immediately
// readable.
const THEMES: BannerTheme[] = ['default', 'brand'];

export const Themes: Story = {
  parameters: { controls: { exclude: ['theme'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {THEMES.map((theme) => (
        <Banner
          key={theme}
          {...args}
          theme={theme}
          type="single-action"
          title={`Theme: ${theme}`}
          description="Read about it from our CEO."
          primaryActionLabel="Read update"
          onPrimaryAction={() => undefined}
          onDismiss={() => undefined}
        />
      ))}
    </div>
  ),
};
