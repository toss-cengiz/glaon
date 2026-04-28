import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Button } from '../Button';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Modal } from './Modal';
import { modalControls, modalExcludeFromArgs } from './Modal.controls';

const { args, argTypes } = defineControls(modalControls);

// Explicit `Meta<typeof Modal>` annotation (rather than `satisfies`)
// keeps the merged static-property type out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Modal.controls.ts`;
// `tags: ['autodocs']` removed because `Modal.mdx` replaces the
// docs tab.
const meta: Meta<typeof Modal> = {
  title: 'Web Primitives/Modal',
  component: Modal,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-modal',
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
          minHeight: 320,
          padding: 24,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const excludeFromArgs = modalExcludeFromArgs;

const SampleHeader = () => (
  <>
    <h2 className="text-lg font-semibold text-primary">Confirm action</h2>
    <p className="text-sm text-tertiary">This will permanently apply the change.</p>
  </>
);

export const Default: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Open modal
        </Button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <SampleHeader />
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-secondary">
            Modals are focus-trapped overlays for blocking decisions or short multi-step flows.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="secondary" size="sm">
            Cancel
          </Button>
          <Button color="primary" size="sm">
            Confirm
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const SizeSm: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Small
        </Button>
      </Modal.Trigger>
      <Modal.Content size="sm">
        <Modal.Header>
          <h2 className="text-lg font-semibold text-primary">Small modal</h2>
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-secondary">Best for short confirmations.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" size="sm">
            OK
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const SizeMd: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Medium
        </Button>
      </Modal.Trigger>
      <Modal.Content size="md">
        <Modal.Header>
          <h2 className="text-lg font-semibold text-primary">Medium modal</h2>
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-secondary">Default size for most flows.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" size="sm">
            OK
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const SizeLg: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Large
        </Button>
      </Modal.Trigger>
      <Modal.Content size="lg">
        <Modal.Header>
          <h2 className="text-lg font-semibold text-primary">Large modal</h2>
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-secondary">Roomier layout for forms or rich content.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" size="sm">
            OK
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const SizeFull: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Full
        </Button>
      </Modal.Trigger>
      <Modal.Content size="full">
        <Modal.Header>
          <h2 className="text-lg font-semibold text-primary">Full-bleed modal</h2>
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-secondary">
            Stretches up to viewport bounds (with margin) — useful for multi-pane editors.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" size="sm">
            OK
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const WithForm: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="primary" size="sm">
          New device
        </Button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <h2 className="text-lg font-semibold text-primary">New device</h2>
          <p className="text-sm text-tertiary">Pair a device by entering its serial number.</p>
        </Modal.Header>
        <Modal.Body>
          <div className="flex flex-col gap-4">
            <Input label="Device name" placeholder="Living room thermostat" size="md" />
            <Input label="Serial number" placeholder="GLA-XXXX-XXXX" size="md" />
            <Textarea label="Notes" placeholder="Optional install notes…" size="md" rows={3} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="secondary" size="sm">
            Cancel
          </Button>
          <Button color="primary" size="sm">
            Pair device
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const Scrollable: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Long content
        </Button>
      </Modal.Trigger>
      <Modal.Content size="md">
        <Modal.Header>
          <h2 className="text-lg font-semibold text-primary">Terms of service</h2>
        </Modal.Header>
        <Modal.Body className="max-h-[60vh]">
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i} className="mb-3 text-sm text-secondary">
              Section {(i + 1).toString()} — long-form content stretches the modal so the body
              scrolls while the header and footer stay pinned. The kit ModalOverlay already locks
              page scroll; the inner Modal.Body adds an internal scrollbar via the max-h constraint.
            </p>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button color="secondary" size="sm">
            Decline
          </Button>
          <Button color="primary" size="sm">
            Accept
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const Persistent: Story = {
  // RAC's `isDismissable` and `isKeyboardDismissDisabled` live on the
  // `<ModalOverlay>` (i.e. `Modal.Content`), not the `<DialogTrigger>`
  // root. Setting both to non-default values blocks click-outside and
  // escape close — the user must use a footer button to dismiss.
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="primary" size="sm">
          Persistent modal
        </Button>
      </Modal.Trigger>
      <Modal.Content isDismissable={false} isKeyboardDismissDisabled>
        <Modal.Header>
          <h2 className="text-lg font-semibold text-primary">Required confirmation</h2>
          <p className="text-sm text-tertiary">
            Click-outside and escape are disabled — choose an option below.
          </p>
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-secondary">
            Use this for irreversible actions where dismissing the dialog shouldn&apos;t
            accidentally cancel the in-progress flow.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="secondary" size="sm">
            Stay
          </Button>
          <Button color="primary-destructive" size="sm">
            Continue anyway
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const Confirmation: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="primary-destructive" size="sm">
          Delete project
        </Button>
      </Modal.Trigger>
      <Modal.Content size="sm">
        <Modal.Header>
          <h2 className="text-lg font-semibold text-primary">Delete project?</h2>
          <p className="text-sm text-tertiary">This action cannot be undone.</p>
        </Modal.Header>
        <Modal.Footer>
          <Button color="secondary" size="sm">
            Cancel
          </Button>
          <Button color="primary-destructive" size="sm">
            Delete
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};
