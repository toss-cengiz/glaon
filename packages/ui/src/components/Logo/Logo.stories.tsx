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
