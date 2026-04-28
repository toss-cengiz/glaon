import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Button } from '../Button';
import { Tooltip } from './Tooltip';
import { tooltipControls, tooltipExcludeFromArgs } from './Tooltip.controls';

const { args, argTypes } = defineControls(tooltipControls);

// Explicit `Meta<typeof Tooltip>` annotation (rather than `satisfies`)
// keeps the kit's deep RAC generic chains out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Tooltip.controls.ts`;
// `tags: ['autodocs']` removed because `Tooltip.mdx` replaces the
// docs tab.
//
// IMPORTANT: don't wrap the trigger element inside the kit's
// `<TooltipTrigger>` *and* a Glaon `<Button>` — kit `TooltipTrigger`
// already renders an `<AriaButton>`, so the combo produces
// button-inside-button which fails axe `nested-interactive`. Pass
// the Glaon `<Button>` (or any focusable element) directly as the
// `<Tooltip>` child; RAC's `TooltipTrigger` context automatically
// wires `aria-describedby` to whichever focusable child it finds.
const meta: Meta<typeof Tooltip> = {
  title: 'Web Primitives/Tooltip',
  component: Tooltip,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-tooltip',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 240,
          padding: 24,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const excludeFromArgs = tooltipExcludeFromArgs;

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button color="secondary" size="sm">
        Hover me
      </Button>
    </Tooltip>
  ),
};

export const WithDescription: Story = {
  args: {
    title: 'Renamed',
    description: 'The previous name was archived to keep history clean.',
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button color="secondary" size="sm">
        Hover me
      </Button>
    </Tooltip>
  ),
};

export const WithArrow: Story = {
  args: { arrow: true },
  render: (args) => (
    <Tooltip {...args}>
      <Button color="secondary" size="sm">
        With arrow
      </Button>
    </Tooltip>
  ),
};

export const Top: Story = {
  args: { placement: 'top' },
  render: (args) => (
    <Tooltip {...args}>
      <Button color="secondary" size="sm">
        Top
      </Button>
    </Tooltip>
  ),
};

export const Bottom: Story = {
  args: { placement: 'bottom' },
  render: (args) => (
    <Tooltip {...args}>
      <Button color="secondary" size="sm">
        Bottom
      </Button>
    </Tooltip>
  ),
};

export const Left: Story = {
  args: { placement: 'left' },
  render: (args) => (
    <Tooltip {...args}>
      <Button color="secondary" size="sm">
        Left
      </Button>
    </Tooltip>
  ),
};

export const Right: Story = {
  args: { placement: 'right' },
  render: (args) => (
    <Tooltip {...args}>
      <Button color="secondary" size="sm">
        Right
      </Button>
    </Tooltip>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultOpen: false },
  render: (args) => (
    <Tooltip {...args}>
      <Button color="secondary" size="sm">
        Tooltip disabled
      </Button>
    </Tooltip>
  ),
};

export const LongContent: Story = {
  args: {
    title: 'A long-form tooltip',
    description:
      'Tooltips are best for short single-line hints. When the content needs more than two lines, consider a Popover (P13) or move the content into the surrounding UI instead.',
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button color="secondary" size="sm">
        Long tooltip
      </Button>
    </Tooltip>
  ),
};

export const SlowDelay: Story = {
  args: { delay: 1200, defaultOpen: false },
  render: (args) => (
    <Tooltip {...args}>
      <Button color="secondary" size="sm">
        Hover (1.2s delay)
      </Button>
    </Tooltip>
  ),
};
