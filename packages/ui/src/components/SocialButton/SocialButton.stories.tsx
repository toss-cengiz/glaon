import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { SocialButton, type SocialBrand, type SocialStyle } from './SocialButton';
import { socialButtonControls, socialButtonExcludeFromArgs } from './SocialButton.controls';

const { args, argTypes } = defineControls(socialButtonControls);

// Explicit `Meta<typeof SocialButton>` annotation (rather than
// `satisfies`) keeps the unexported `SocialButtonProps` interface
// out of the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true` and TS4023 fires when an exported `meta`
// resolves to a non-exported nominal type.
const meta: Meta<typeof SocialButton> = {
  title: 'Web Primitives/SocialButton',
  component: SocialButton,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-social-button',
    },
  },
  args,
  argTypes,
};

export default meta;
type Story = StoryObj<typeof SocialButton>;

export const excludeFromArgs = socialButtonExcludeFromArgs;

export const Default: Story = {};

export const Apple: Story = {
  args: { brand: 'apple' },
};

export const Facebook: Story = {
  args: { brand: 'facebook' },
};

export const Twitter: Story = {
  args: { brand: 'twitter' },
};

export const Figma: Story = {
  args: { brand: 'figma', style: 'black-outline' },
};

export const Dribbble: Story = {
  args: { brand: 'dribbble' },
};

export const NoSupportingText: Story = {
  args: { brand: 'google', supportingText: false },
};

export const BlackOutline: Story = {
  args: { brand: 'apple', style: 'black-outline' },
};

export const WhiteOutline: Story = {
  args: { brand: 'apple', style: 'white-outline' },
};

export const IconOnly: Story = {
  args: { brand: 'google', style: 'icon-only' },
  decorators: [
    (Story) => (
      <div className="flex h-20 items-center bg-secondary p-4">
        <Story />
      </div>
    ),
  ],
};

export const AsLink: Story = {
  args: { brand: 'google', href: '#' },
};

const BRANDS: SocialBrand[] = ['apple', 'dribbble', 'facebook', 'figma', 'google', 'twitter'];

// Matrix story: iterates `brand` and renders all 6 providers in a
// single canvas. Other props still flow through `{...args}`.
export const Brands: Story = {
  parameters: { controls: { exclude: ['brand'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {BRANDS.map((brand) => (
        <SocialButton key={brand} {...args} brand={brand} />
      ))}
    </div>
  ),
};

const STYLES: SocialStyle[] = ['brand', 'black-outline', 'white-outline', 'icon-only'];

// Matrix story: iterates `style` for the same brand. The
// `white-outline` variant is rendered on a dark surface so it's
// visible.
export const Styles: Story = {
  parameters: { controls: { exclude: ['style'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {STYLES.map((style) => (
        <div
          key={style}
          className={
            style === 'white-outline'
              ? 'flex items-center gap-3 bg-utility-gray-900 p-3'
              : 'flex items-center gap-3'
          }
        >
          <span
            className={
              style === 'white-outline'
                ? 'min-w-32 text-xs text-white'
                : 'min-w-32 text-xs text-tertiary'
            }
          >
            style: {style}
          </span>
          <SocialButton {...args} style={style} />
        </div>
      ))}
    </div>
  ),
};

// Matrix story: iterates `size` (sm / md / lg).
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size'] } },
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <SocialButton key={size} {...args} size={size} />
      ))}
    </div>
  ),
};
