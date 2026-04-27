import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Button } from '../Button';
import { Tooltip } from './Tooltip';

// Explicit `Meta<typeof Tooltip>` annotation (rather than `satisfies`)
// keeps the kit's deep RAC generic chains out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true`.
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
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-tooltip',
    },
  },
  args: {
    title: 'Tooltip text',
    placement: 'top',
    arrow: false,
    delay: 300,
    closeDelay: 0,
    isDisabled: false,
    defaultOpen: true,
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    placement: {
      control: 'select',
      options: [
        'top',
        'top start',
        'top end',
        'bottom',
        'bottom start',
        'bottom end',
        'left',
        'left top',
        'left bottom',
        'right',
        'right top',
        'right bottom',
      ],
    },
    arrow: { control: 'boolean' },
    delay: { control: { type: 'number', min: 0, max: 2000, step: 100 } },
    closeDelay: { control: { type: 'number', min: 0, max: 2000, step: 100 } },
    isDisabled: { control: 'boolean' },
    isOpen: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    offset: { control: { type: 'number', min: 0, max: 40, step: 1 } },
    crossOffset: { control: { type: 'number', min: -40, max: 40, step: 1 } },
    trigger: { control: 'inline-radio', options: ['focus', undefined] },
    onOpenChange: { control: false, action: 'open-changed' },
    children: { control: false, table: { disable: true } },
  },
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

// Kit-internal props that aren't useful as Storybook controls but
// flow through type-checking; covered by the F6 prop-coverage gate.
export const excludeFromArgs = [
  'shouldFlip',
  'arrowBoundaryOffset',
  'containerPadding',
  'shouldUpdatePosition',
  'isEntering',
  'isExiting',
  'UNSAFE_className',
  'UNSAFE_style',
  'translate',
  'slot',
];

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
