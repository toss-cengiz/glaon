import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Badge } from './Badge';
import { badgeControls, badgeExcludeFromArgs } from './Badge.controls';

const { args, argTypes } = defineControls(badgeControls);

// Explicit `Meta<typeof Badge>` annotation (rather than `satisfies`) keeps
// the kit's unexported `BadgeProps` interface out of the exported type
// signature — `tsc --noEmit` runs with `declaration: true` and TS4023
// fires when an exported `meta` resolves to a non-exported nominal type.
//
// Phase 1.5: `args` + `argTypes` come from `Badge.controls.ts` so the
// story file stays declarative; the MDX docs page (`Badge.mdx`) reads
// from the same spec. `tags: ['autodocs']` removed — the MDX page
// replaces autodocs as the per-component documentation entry point.
const meta: Meta<typeof Badge> = {
  title: 'Web Primitives/Badge',
  component: Badge,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-badge',
    },
  },
  args,
  argTypes,
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const excludeFromArgs = badgeExcludeFromArgs;

export const Default: Story = {};

export const PillColor: Story = {
  args: { type: 'pill-color', color: 'brand', children: 'Brand' },
};

export const Color: Story = {
  args: { type: 'color', color: 'success', children: 'Success' },
};

export const Modern: Story = {
  args: { type: 'modern', children: 'Modern' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Badge key={size} {...args} size={size}>
          {size.toUpperCase()}
        </Badge>
      ))}
    </div>
  ),
};

export const Colors: Story = {
  render: (args) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, max-content)',
        gap: 12,
        alignItems: 'center',
      }}
    >
      {(
        [
          'gray',
          'brand',
          'error',
          'warning',
          'success',
          'slate',
          'sky',
          'blue',
          'indigo',
          'purple',
          'pink',
          'orange',
        ] as const
      ).map((color) => (
        <Badge key={color} {...args} color={color}>
          {color}
        </Badge>
      ))}
    </div>
  ),
};

export const Types: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      {(['pill-color', 'color', 'modern'] as const).map((type) => (
        <Badge key={type} {...args} type={type}>
          {type}
        </Badge>
      ))}
    </div>
  ),
};
