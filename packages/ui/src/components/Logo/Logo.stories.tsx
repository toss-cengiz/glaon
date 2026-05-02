import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Logo } from './Logo';
import { logoControls, logoExcludeFromArgs } from './Logo.controls';

const { args, argTypes } = defineControls(logoControls);

const meta: Meta<typeof Logo> = {
  title: 'Web Primitives/Logo',
  component: Logo,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/JLbLmCMDdhxOisbVYiAo5C/Brand-Guidelines?node-id=web-primitives-logo',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div style={{ padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const excludeFromArgs = logoExcludeFromArgs;

export const Default: Story = {
  args: { size: 240 },
};

export const Symbol: Story = {
  args: { variant: 'symbol', size: 96 },
};

export const Dark: Story = {
  args: { theme: 'dark', size: 240, background: 'var(--brand-700)' },
};

export const SymbolDark: Story = {
  args: { variant: 'symbol', theme: 'dark', size: 96, background: 'var(--brand-700)' },
};

export const Decorative: Story = {
  args: { variant: 'symbol', size: 96, decorative: true },
};

// Chrome — `padding` adds breathing room between the SVG and the
// wrapper edge; pair with `background` for a tile-style presentation.
export const Padded: Story = {
  args: {
    variant: 'symbol',
    size: 64,
    padding: 16,
    background: 'var(--brand-50)',
  },
};

// `radius` rounds the wrapper. Combine with `padding` and `background`
// for a chip-style mark — useful for compact brand badges in cards
// and list rows.
export const Rounded: Story = {
  args: {
    variant: 'symbol',
    size: 56,
    padding: 14,
    radius: '9999px',
    background: 'var(--brand-50)',
  },
};

// `border` adds a hairline outline around the wrapper. Mirrors the
// TopBar treatment where the brand mark sits inside a thin neutral
// frame for added definition on warm panels.
export const Bordered: Story = {
  args: {
    variant: 'wordmark',
    size: 200,
    padding: '12px 20px',
    radius: 12,
    border: '1px solid var(--color-secondary-alt)',
  },
};

// `href` turns the entire mark into an `<a>` — typical "home" link in
// a TopBar / SideNav. Always carries `aria-label` so screen readers
// announce the link target.
export const AsLink: Story = {
  args: {
    variant: 'symbol',
    size: 40,
    href: '#home',
    label: 'Glaon — go to home',
  },
};

// `onPress` renders a `<button type="button">` instead — use when the
// logo opens a menu or triggers a programmatic action. Mutually
// exclusive with `href`. Inline noop here so the wrapper picks the
// button branch; consumers wire a real handler.
export const WithHandler: Story = {
  args: {
    variant: 'symbol',
    size: 40,
    label: 'Open brand menu',
    onPress: () => undefined,
  },
};

// Gallery — all four variants on their natural surfaces. Mirrors the
// Brand Guideline placement grid so designers can verify pixel parity
// against the Figma frame.
export const AllVariants: Story = {
  args: { size: 220 },
  render: (storyArgs) => {
    const swatches: { theme: 'light' | 'dark'; background: string; label: string }[] = [
      { theme: 'light', background: 'var(--base-white)', label: 'light · base-white' },
      { theme: 'light', background: 'var(--base-dirty)', label: 'light · base-dirty' },
      { theme: 'dark', background: 'var(--brand-500)', label: 'dark · brand-500' },
      { theme: 'dark', background: 'var(--brand-700)', label: 'dark · brand-700' },
    ];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {swatches.flatMap(({ theme, background, label }) =>
          (['wordmark', 'symbol'] as const).map((variant) => (
            <div
              key={`${variant}-${theme}-${background}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 24,
                borderRadius: 12,
                background,
                border: '1px solid var(--neutral-200)',
              }}
            >
              <Logo
                {...storyArgs}
                variant={variant}
                theme={theme}
                background="transparent"
                size={variant === 'wordmark' ? 220 : 80}
              />
              <span
                style={{
                  fontSize: 12,
                  color: theme === 'dark' ? 'var(--base-dirty)' : 'var(--neutral-700)',
                }}
              >
                {variant} · {label}
              </span>
            </div>
          )),
        )}
      </div>
    );
  },
};
