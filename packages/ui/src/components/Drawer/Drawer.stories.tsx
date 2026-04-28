import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Button } from '../Button';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Drawer } from './Drawer';
import { drawerControls, drawerExcludeFromArgs } from './Drawer.controls';

const { args, argTypes } = defineControls(drawerControls);

// Explicit `Meta<typeof Drawer>` annotation (rather than `satisfies`)
// keeps the merged static-property type out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Drawer.controls.ts`;
// `tags: ['autodocs']` removed because `Drawer.mdx` replaces the
// docs tab.
const meta: Meta<typeof Drawer> = {
  title: 'Web Primitives/Drawer',
  component: Drawer,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-drawer',
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
          minHeight: 400,
          padding: 24,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Drawer>;

export const excludeFromArgs = drawerExcludeFromArgs;

const SampleHeader = () => (
  <>
    <h2 className="text-lg font-semibold text-primary">Settings</h2>
    <p className="text-sm text-tertiary">Tweak the defaults for this workspace.</p>
  </>
);

const SampleBody = () => (
  <p className="text-sm text-secondary">
    Drawer content sits in a slide-in panel. Use it for forms, filters, or any flow where the user
    needs context from the page behind the panel.
  </p>
);

const SampleFooter = () => (
  <>
    <Button color="secondary" size="sm">
      Cancel
    </Button>
    <Button color="primary" size="sm">
      Save
    </Button>
  </>
);

export const Default: Story = {
  render: (args) => (
    <Drawer {...args}>
      <Drawer.Trigger>
        <Button color="secondary" size="sm">
          Open drawer
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <SampleHeader />
        </Drawer.Header>
        <Drawer.Body>
          <SampleBody />
        </Drawer.Body>
        <Drawer.Footer>
          <SampleFooter />
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};

export const SideRight: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Drawer {...args}>
      <Drawer.Trigger>
        <Button color="secondary" size="sm">
          Right
        </Button>
      </Drawer.Trigger>
      <Drawer.Content side="right">
        <Drawer.Header>
          <h2 className="text-lg font-semibold text-primary">Right</h2>
        </Drawer.Header>
        <Drawer.Body>
          <SampleBody />
        </Drawer.Body>
        <Drawer.Footer>
          <SampleFooter />
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};

export const SideLeft: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Drawer {...args}>
      <Drawer.Trigger>
        <Button color="secondary" size="sm">
          Left
        </Button>
      </Drawer.Trigger>
      <Drawer.Content side="left">
        <Drawer.Header>
          <h2 className="text-lg font-semibold text-primary">Left</h2>
        </Drawer.Header>
        <Drawer.Body>
          <SampleBody />
        </Drawer.Body>
        <Drawer.Footer>
          <SampleFooter />
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};

export const SideTop: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Drawer {...args}>
      <Drawer.Trigger>
        <Button color="secondary" size="sm">
          Top
        </Button>
      </Drawer.Trigger>
      <Drawer.Content side="top">
        <Drawer.Header>
          <h2 className="text-lg font-semibold text-primary">Top</h2>
        </Drawer.Header>
        <Drawer.Body>
          <SampleBody />
        </Drawer.Body>
        <Drawer.Footer>
          <SampleFooter />
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};

export const SideBottom: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Drawer {...args}>
      <Drawer.Trigger>
        <Button color="secondary" size="sm">
          Bottom
        </Button>
      </Drawer.Trigger>
      <Drawer.Content side="bottom">
        <Drawer.Header>
          <h2 className="text-lg font-semibold text-primary">Bottom</h2>
        </Drawer.Header>
        <Drawer.Body>
          <SampleBody />
        </Drawer.Body>
        <Drawer.Footer>
          <SampleFooter />
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};

export const WithForm: Story = {
  render: (args) => (
    <Drawer {...args}>
      <Drawer.Trigger>
        <Button color="primary" size="sm">
          Pair device
        </Button>
      </Drawer.Trigger>
      <Drawer.Content side="right" size="md">
        <Drawer.Header>
          <h2 className="text-lg font-semibold text-primary">Pair device</h2>
          <p className="text-sm text-tertiary">Enter the serial and an optional label.</p>
        </Drawer.Header>
        <Drawer.Body>
          <div className="flex flex-col gap-4">
            <Input label="Device name" placeholder="Living room thermostat" size="md" />
            <Input label="Serial number" placeholder="GLA-XXXX-XXXX" size="md" />
            <Textarea label="Notes" placeholder="Optional install notes…" size="md" rows={3} />
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Button color="secondary" size="sm">
            Cancel
          </Button>
          <Button color="primary" size="sm">
            Pair
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};

export const Persistent: Story = {
  // RAC's `isDismissable` and `isKeyboardDismissDisabled` belong on
  // the overlay (`Drawer.Content`), not the `<DialogTrigger>` root.
  render: (args) => (
    <Drawer {...args}>
      <Drawer.Trigger>
        <Button color="primary" size="sm">
          Persistent drawer
        </Button>
      </Drawer.Trigger>
      <Drawer.Content side="right" isDismissable={false} isKeyboardDismissDisabled>
        <Drawer.Header>
          <h2 className="text-lg font-semibold text-primary">Required confirmation</h2>
          <p className="text-sm text-tertiary">
            Click-outside and escape are disabled — choose an option below.
          </p>
        </Drawer.Header>
        <Drawer.Body>
          <p className="text-sm text-secondary">
            Use this for irreversible flows where dismissing the drawer shouldn&apos;t accidentally
            cancel in-progress work.
          </p>
        </Drawer.Body>
        <Drawer.Footer>
          <Button color="secondary" size="sm">
            Stay
          </Button>
          <Button color="primary-destructive" size="sm">
            Continue
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};

export const SizeFull: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Drawer {...args}>
      <Drawer.Trigger>
        <Button color="secondary" size="sm">
          Full
        </Button>
      </Drawer.Trigger>
      <Drawer.Content side="right" size="full">
        <Drawer.Header>
          <h2 className="text-lg font-semibold text-primary">Full-screen drawer</h2>
        </Drawer.Header>
        <Drawer.Body>
          <p className="text-sm text-secondary">
            Useful when the drawer needs the full viewport — e.g. a multi-pane editor or a takeover
            form.
          </p>
        </Drawer.Body>
        <Drawer.Footer>
          <Button color="primary" size="sm">
            Done
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};
