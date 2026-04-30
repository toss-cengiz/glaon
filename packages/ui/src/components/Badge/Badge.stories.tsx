import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';
import { Badge, type BadgeIconKind } from './Badge';
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
//
// #299: Glaon `<Badge>` is now a parametric wrap dispatching to the
// kit's 7 sibling primitives via the `icon` discriminator. Default
// remains backwards-compatible — `icon` defaults to `'none'`, so
// existing canvases are byte-equal.
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

// Matrix stories iterate over a single prop and render every variant
// side by side; the Storybook controls panel hides the iterated prop
// because changing it on a matrix is meaningless (each instance owns
// its own value). Other props still flow through `{...args}` so the
// remaining controls stay live.
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size'] } },
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
  parameters: { controls: { exclude: ['color'] } },
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
  parameters: { controls: { exclude: ['type'] } },
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

// `Icons` matrix surfaces every value of the `icon` discriminator
// in one canvas, so callers can see how the parametric wrap dispatches
// to each kit primitive. Per-icon slot props (`iconComponent`,
// `imgSrc`, `flag`, `onClose`) are baked in here for the demo —
// controls that drive *those* slots stay live for the Default story
// where the user explores them interactively.
const StarIcon = storybookIcons.star;

const ICON_KINDS: { icon: BadgeIconKind; label: string }[] = [
  { icon: 'none', label: 'Label' },
  { icon: 'dot', label: 'Dot' },
  { icon: 'leading', label: 'Leading' },
  { icon: 'trailing', label: 'Trailing' },
  { icon: 'only', label: '' },
  { icon: 'avatar', label: 'Olivia' },
  { icon: 'flag', label: 'Türkiye' },
  { icon: 'close', label: 'Filter' },
];

export const Icons: Story = {
  parameters: { controls: { exclude: ['icon', 'iconComponent', 'imgSrc', 'flag', 'onClose'] } },
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      {ICON_KINDS.map(({ icon, label }) => (
        <Badge
          key={icon}
          {...args}
          icon={icon}
          iconComponent={
            icon === 'leading' || icon === 'trailing' || icon === 'only' ? StarIcon : undefined
          }
          imgSrc={
            icon === 'avatar'
              ? 'https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80'
              : undefined
          }
          flag={icon === 'flag' ? 'TR' : undefined}
          onClose={icon === 'close' ? () => undefined : undefined}
          closeLabel={icon === 'close' ? 'Remove filter' : undefined}
        >
          {label}
        </Badge>
      ))}
    </div>
  ),
};
