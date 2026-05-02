import { Calendar, Grid01, List, Map01 } from '@untitledui/icons';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { ButtonGroup } from './ButtonGroup';
import { buttonGroupControls, buttonGroupExcludeFromArgs } from './ButtonGroup.controls';

const { args, argTypes } = defineControls(buttonGroupControls);

// Explicit `Meta<typeof ButtonGroup>` annotation (rather than
// `satisfies`) keeps the Object.assign namespace shape out of the
// exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `ButtonGroup.controls.ts`;
// `tags: ['autodocs']` is omitted because `ButtonGroup.mdx` replaces
// the docs tab.
const meta: Meta<typeof ButtonGroup> = {
  title: 'Web Primitives/ButtonGroup',
  component: ButtonGroup,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=16-399',
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
type Story = StoryObj<typeof ButtonGroup>;

export const excludeFromArgs = buttonGroupExcludeFromArgs;

export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroup.Item value="day">Day</ButtonGroup.Item>
      <ButtonGroup.Item value="week">Week</ButtonGroup.Item>
      <ButtonGroup.Item value="month">Month</ButtonGroup.Item>
      <ButtonGroup.Item value="year">Year</ButtonGroup.Item>
    </ButtonGroup>
  ),
};

// `iconLeading` precedes the label — useful when the icon adds
// recognition (calendar / clock / view-mode glyphs).
export const WithIcons: Story = {
  args: { defaultValue: 'list', 'aria-label': 'View mode' },
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroup.Item value="list" iconLeading={List}>
        List
      </ButtonGroup.Item>
      <ButtonGroup.Item value="grid" iconLeading={Grid01}>
        Grid
      </ButtonGroup.Item>
      <ButtonGroup.Item value="map" iconLeading={Map01}>
        Map
      </ButtonGroup.Item>
    </ButtonGroup>
  ),
};

// `dot` prefixes the label with a status colour — segmented filters
// for ticket / project status sweeps. The dot is purely decorative
// (`aria-hidden`), so the label still carries semantic meaning.
export const WithDots: Story = {
  args: { defaultValue: 'active', 'aria-label': 'Project status filter' },
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroup.Item value="active" dot="success">
        Active
      </ButtonGroup.Item>
      <ButtonGroup.Item value="paused" dot="warning">
        Paused
      </ButtonGroup.Item>
      <ButtonGroup.Item value="archived" dot="gray">
        Archived
      </ButtonGroup.Item>
    </ButtonGroup>
  ),
};

// `iconOnly` strips the visible label — the segment becomes a
// compact toolbar-style toggle. Each item must carry `aria-label`
// so axe `button-name` stays green and screen readers announce the
// segment purpose.
export const IconOnly: Story = {
  args: { defaultValue: 'list', 'aria-label': 'View mode' },
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroup.Item value="list" iconLeading={List} iconOnly aria-label="View as list">
        List
      </ButtonGroup.Item>
      <ButtonGroup.Item value="grid" iconLeading={Grid01} iconOnly aria-label="View as grid">
        Grid
      </ButtonGroup.Item>
      <ButtonGroup.Item value="map" iconLeading={Map01} iconOnly aria-label="View as map">
        Map
      </ButtonGroup.Item>
    </ButtonGroup>
  ),
};

// `isDisabled` on the parent cascades to every segment. Use for
// transient states ("loading filters from server") or guarded UI.
export const Disabled: Story = {
  args: { defaultValue: 'week', isDisabled: true, 'aria-label': 'Date range (loading)' },
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroup.Item value="day">Day</ButtonGroup.Item>
      <ButtonGroup.Item value="week">Week</ButtonGroup.Item>
      <ButtonGroup.Item value="month">Month</ButtonGroup.Item>
      <ButtonGroup.Item value="year">Year</ButtonGroup.Item>
    </ButtonGroup>
  ),
};

// Per-segment `isDisabled` while the rest of the group stays
// interactive. Useful for licence-gated views or temporarily
// unavailable filters (e.g. "Year" pending data backfill).
export const DisabledItem: Story = {
  args: { defaultValue: 'day', 'aria-label': 'Date range' },
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroup.Item value="day">Day</ButtonGroup.Item>
      <ButtonGroup.Item value="week">Week</ButtonGroup.Item>
      <ButtonGroup.Item value="month">Month</ButtonGroup.Item>
      <ButtonGroup.Item value="year" isDisabled>
        Year
      </ButtonGroup.Item>
    </ButtonGroup>
  ),
};

// Side-by-side size matrix — the `sm` rail (h-9) for dense
// filter-bar contexts, `md` (h-10) for primary view toggles.
export const Sizes: Story = {
  args: { 'aria-label': 'Date range' },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ButtonGroup {...args} size="sm" defaultValue="day">
        <ButtonGroup.Item value="day" iconLeading={Calendar}>
          Day
        </ButtonGroup.Item>
        <ButtonGroup.Item value="week" iconLeading={Calendar}>
          Week
        </ButtonGroup.Item>
        <ButtonGroup.Item value="month" iconLeading={Calendar}>
          Month
        </ButtonGroup.Item>
      </ButtonGroup>
      <ButtonGroup {...args} size="md" defaultValue="week">
        <ButtonGroup.Item value="day" iconLeading={Calendar}>
          Day
        </ButtonGroup.Item>
        <ButtonGroup.Item value="week" iconLeading={Calendar}>
          Week
        </ButtonGroup.Item>
        <ButtonGroup.Item value="month" iconLeading={Calendar}>
          Month
        </ButtonGroup.Item>
      </ButtonGroup>
    </div>
  ),
};

// All four item visual modes (label / icon+label / dot+label /
// icon-only) on the same `md` size so designers can verify pixel
// parity against the Figma `_Button group base` cell matrix.
export const Variants: Story = {
  args: { 'aria-label': 'Variant gallery' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ButtonGroup defaultValue="b" aria-label="Label only">
        <ButtonGroup.Item value="a">Day</ButtonGroup.Item>
        <ButtonGroup.Item value="b">Week</ButtonGroup.Item>
        <ButtonGroup.Item value="c">Month</ButtonGroup.Item>
      </ButtonGroup>
      <ButtonGroup defaultValue="b" aria-label="Leading icon + label">
        <ButtonGroup.Item value="a" iconLeading={Calendar}>
          Day
        </ButtonGroup.Item>
        <ButtonGroup.Item value="b" iconLeading={Calendar}>
          Week
        </ButtonGroup.Item>
        <ButtonGroup.Item value="c" iconLeading={Calendar}>
          Month
        </ButtonGroup.Item>
      </ButtonGroup>
      <ButtonGroup defaultValue="b" aria-label="Dot + label">
        <ButtonGroup.Item value="a" dot="success">
          Active
        </ButtonGroup.Item>
        <ButtonGroup.Item value="b" dot="warning">
          Paused
        </ButtonGroup.Item>
        <ButtonGroup.Item value="c" dot="gray">
          Archived
        </ButtonGroup.Item>
      </ButtonGroup>
      <ButtonGroup defaultValue="b" aria-label="Icon only">
        <ButtonGroup.Item value="a" iconLeading={List} iconOnly aria-label="List">
          List
        </ButtonGroup.Item>
        <ButtonGroup.Item value="b" iconLeading={Grid01} iconOnly aria-label="Grid">
          Grid
        </ButtonGroup.Item>
        <ButtonGroup.Item value="c" iconLeading={Map01} iconOnly aria-label="Map">
          Map
        </ButtonGroup.Item>
      </ButtonGroup>
    </div>
  ),
};
