import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Button } from '../Button';
import { Input } from '../Input';
import { Popover } from './Popover';
import { popoverControls, popoverExcludeFromArgs } from './Popover.controls';

const { args, argTypes } = defineControls(popoverControls);

// Explicit `Meta<typeof Popover>` annotation (rather than `satisfies`)
// keeps the merged static-property type out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Popover.controls.ts`;
// `tags: ['autodocs']` removed because `Popover.mdx` replaces the
// docs tab.
const meta: Meta<typeof Popover> = {
  title: 'Web Primitives/Popover',
  component: Popover,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-popover',
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
          height: 320,
          padding: 24,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const excludeFromArgs = popoverExcludeFromArgs;

export const Default: Story = {
  render: (args) => (
    <Popover {...args}>
      <Popover.Trigger>
        <Button color="secondary" size="sm">
          Open popover
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <div className="w-64 p-4">
          <p className="text-sm font-semibold text-primary">Popover title</p>
          <p className="mt-1 text-sm text-secondary">
            Popovers are click-triggered overlays for richer content than a tooltip.
          </p>
        </div>
      </Popover.Content>
    </Popover>
  ),
};

export const Top: Story = {
  render: (args) => (
    <Popover {...args}>
      <Popover.Trigger>
        <Button color="secondary" size="sm">
          Top
        </Button>
      </Popover.Trigger>
      <Popover.Content placement="top">
        <div className="w-64 p-4">
          <p className="text-sm text-secondary">Placed above the trigger.</p>
        </div>
      </Popover.Content>
    </Popover>
  ),
};

export const Bottom: Story = {
  render: (args) => (
    <Popover {...args}>
      <Popover.Trigger>
        <Button color="secondary" size="sm">
          Bottom
        </Button>
      </Popover.Trigger>
      <Popover.Content placement="bottom">
        <div className="w-64 p-4">
          <p className="text-sm text-secondary">Placed below the trigger.</p>
        </div>
      </Popover.Content>
    </Popover>
  ),
};

export const Left: Story = {
  render: (args) => (
    <Popover {...args}>
      <Popover.Trigger>
        <Button color="secondary" size="sm">
          Left
        </Button>
      </Popover.Trigger>
      <Popover.Content placement="left">
        <div className="w-64 p-4">
          <p className="text-sm text-secondary">Placed to the left.</p>
        </div>
      </Popover.Content>
    </Popover>
  ),
};

export const Right: Story = {
  render: (args) => (
    <Popover {...args}>
      <Popover.Trigger>
        <Button color="secondary" size="sm">
          Right
        </Button>
      </Popover.Trigger>
      <Popover.Content placement="right">
        <div className="w-64 p-4">
          <p className="text-sm text-secondary">Placed to the right.</p>
        </div>
      </Popover.Content>
    </Popover>
  ),
};

export const WithRichContent: Story = {
  render: (args) => (
    <Popover {...args}>
      <Popover.Trigger>
        <Button color="secondary" size="sm">
          Quick edit
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <div className="flex w-80 flex-col gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-primary">Rename project</p>
            <p className="mt-1 text-xs text-tertiary">
              The new name shows up everywhere this project is referenced.
            </p>
          </div>
          <Input aria-label="Project name" placeholder="New project name" size="sm" />
          <div className="flex justify-end gap-2">
            <Button color="secondary" size="sm">
              Cancel
            </Button>
            <Button color="primary" size="sm">
              Save
            </Button>
          </div>
        </div>
      </Popover.Content>
    </Popover>
  ),
};

// `OpenState` carries the open-popover snapshot for Chromatic. We
// also opt this story OUT of the MDX `<Stories>` docs block via
// `parameters.docs.disable: true` — keeps docs page readable +
// Storybook navigator + Chromatic still see the story. See #316
// for the rationale.
export const OpenState: Story = {
  parameters: { docs: { disable: true } },
  args: { defaultOpen: true },
  render: (args) => (
    <Popover {...args}>
      <Popover.Trigger>
        <Button color="secondary" size="sm">
          Open popover
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <div className="w-64 p-4">
          <p className="text-sm font-semibold text-primary">Popover title</p>
          <p className="mt-1 text-sm text-secondary">
            Popovers are click-triggered overlays for richer content than a tooltip.
          </p>
        </div>
      </Popover.Content>
    </Popover>
  ),
};
