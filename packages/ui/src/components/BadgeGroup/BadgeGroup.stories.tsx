import type { FC } from 'react';

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Badge } from '../Badge';
import { storybookIcons } from '../../icons/storybook';
import { BadgeGroup } from './BadgeGroup';
import { badgeGroupControls, badgeGroupExcludeFromArgs } from './BadgeGroup.controls';

// `storybookIcons.<key>` is typed as `IconComponent | undefined` (so
// the `none` option resolves to `undefined`); `BadgeGroup.trailingIcon`
// requires non-undefined under `exactOptionalPropertyTypes`. Cast
// once via this helper for the canonical-icon stories.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
const icon = (key: keyof typeof storybookIcons): FC<any> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
  storybookIcons[key] as FC<any>;
const chevronRight = icon('chevronRight');

const { args, argTypes } = defineControls(badgeGroupControls);

// Explicit `Meta<typeof BadgeGroup>` annotation (rather than
// `satisfies`) keeps the unexported `BadgeGroupProps` interface out
// of the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true` and TS4023 fires when an exported `meta`
// resolves to a non-exported nominal type.
//
// The Default story bakes a sensible `<Badge>` instance into the
// `addon` slot so the canvas renders meaningfully. Storybook
// controls don't expose `addon` directly (it's `type: false` in the
// controls spec) since picking a ReactNode through a knob doesn't
// match how callers actually use the component.
const meta: Meta<typeof BadgeGroup> = {
  title: 'Web Primitives/BadgeGroup',
  component: BadgeGroup,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-badge-group',
    },
  },
  args: {
    ...args,
    addon: <Badge size="sm">What&rsquo;s new</Badge>,
  },
  argTypes,
};

export default meta;
type Story = StoryObj<typeof BadgeGroup>;

export const excludeFromArgs = badgeGroupExcludeFromArgs;

export const Default: Story = {};

export const Brand: Story = {
  args: {
    color: 'brand',
    addon: (
      <Badge color="brand" size="sm">
        New
      </Badge>
    ),
  },
};

export const WithTrailingChevron: Story = {
  args: {
    color: 'brand',
    addon: (
      <Badge color="brand" size="sm">
        v1.4
      </Badge>
    ),
    trailingIcon: chevronRight,
    children: 'See release notes',
  },
};

export const TrailingPlacement: Story = {
  args: {
    color: 'success',
    addonPlacement: 'trailing',
    addon: (
      <Badge color="success" size="sm">
        Live
      </Badge>
    ),
    children: 'API status',
  },
};

export const AsLink: Story = {
  args: {
    color: 'brand',
    addon: (
      <Badge color="brand" size="sm">
        What&rsquo;s new
      </Badge>
    ),
    trailingIcon: chevronRight,
    href: '#',
    children: 'Read post',
  },
};

export const Pressable: Story = {
  args: {
    color: 'brand',
    addon: (
      <Badge color="brand" size="sm">
        Beta
      </Badge>
    ),
    trailingIcon: chevronRight,
    onPress: () => undefined,
    children: 'Try the new editor',
  },
};

export const Sizes: Story = {
  parameters: { controls: { exclude: ['size'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <BadgeGroup key={size} {...args} size={size} />
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
        gridTemplateColumns: 'repeat(3, max-content)',
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
        <BadgeGroup
          key={color}
          {...args}
          color={color}
          addon={
            <Badge color={color} size="sm">
              {color}
            </Badge>
          }
        >
          Read more
        </BadgeGroup>
      ))}
    </div>
  ),
};
