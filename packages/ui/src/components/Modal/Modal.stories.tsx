import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { AlertTriangle, CheckCircle, InfoCircle, Trash01, Zap } from '@untitledui/icons';

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
    <Modal.Title>Confirm action</Modal.Title>
    <Modal.Description>This will permanently apply the change.</Modal.Description>
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
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="primary-destructive" size="sm">
          Delete project
        </Button>
      </Modal.Trigger>
      <Modal.Content size="sm">
        <Modal.Header>
          <Modal.Title>Delete project?</Modal.Title>
          <Modal.Description>This action cannot be undone.</Modal.Description>
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

export const SizeXl: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Extra large
        </Button>
      </Modal.Trigger>
      <Modal.Content size="xl">
        <Modal.Header>
          <Modal.Title>Extra-large modal</Modal.Title>
          <Modal.Description>
            Wider than `lg`; useful for split panes or rich previews.
          </Modal.Description>
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-secondary">
            Use sparingly — desktop only flows where the content genuinely benefits from extra
            horizontal real estate.
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

// ─── New sub-component stories ───────────────────────────────────────────
//
// Modal.CloseButton renders an X affordance in the top-right corner
// using RAC `slot="close"` so the dialog closes via the click-target
// without consumer wiring. Modal.FeaturedIcon renders a colored chip
// above the title for intent-themed dialogs (success / warning /
// error / info / brand). Pair them with Modal.Title +
// Modal.Description so RAC's `aria-labelledby` /
// `aria-describedby` slots wire up automatically.

export const WithCloseButton: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Open with X
        </Button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.CloseButton />
        <Modal.Header>
          <Modal.Title>Settings updated</Modal.Title>
          <Modal.Description>
            Your preferences were saved. Close the dialog when you&apos;re done reviewing.
          </Modal.Description>
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-secondary">
            The X in the top-right closes via RAC&apos;s &ldquo;slot=close&rdquo; contract — no
            onPress wiring required.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" size="sm">
            Got it
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const WithFeaturedIconBrand: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="primary" size="sm">
          Upgrade plan
        </Button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.CloseButton />
        <Modal.Header>
          <Modal.FeaturedIcon icon={Zap} color="brand" theme="light" />
          <Modal.Title>Upgrade to Pro</Modal.Title>
          <Modal.Description>
            Unlock priority support, advanced analytics, and unlimited integrations.
          </Modal.Description>
        </Modal.Header>
        <Modal.Footer>
          <Button color="secondary" size="sm">
            Maybe later
          </Button>
          <Button color="primary" size="sm">
            Upgrade
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const IntentSuccess: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Show success
        </Button>
      </Modal.Trigger>
      <Modal.Content size="sm">
        <Modal.Header>
          <Modal.FeaturedIcon icon={CheckCircle} color="success" theme="light" />
          <Modal.Title>Payment received</Modal.Title>
          <Modal.Description>
            Your invoice has been settled and a receipt was sent to your email.
          </Modal.Description>
        </Modal.Header>
        <Modal.Footer align="center">
          <Button color="primary" size="sm">
            Done
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const IntentWarning: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Show warning
        </Button>
      </Modal.Trigger>
      <Modal.Content size="sm">
        <Modal.Header>
          <Modal.FeaturedIcon icon={AlertTriangle} color="warning" theme="light" />
          <Modal.Title>Unsaved changes</Modal.Title>
          <Modal.Description>
            Leaving now will discard the changes you made to this device profile.
          </Modal.Description>
        </Modal.Header>
        <Modal.Footer>
          <Button color="secondary" size="sm">
            Stay
          </Button>
          <Button color="primary" size="sm">
            Discard
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const IntentError: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="primary-destructive" size="sm">
          Delete project
        </Button>
      </Modal.Trigger>
      <Modal.Content size="sm">
        <Modal.Header>
          <Modal.FeaturedIcon icon={Trash01} color="error" theme="light" />
          <Modal.Title>Delete project?</Modal.Title>
          <Modal.Description>
            This action cannot be undone. All devices and automations under this project will be
            removed.
          </Modal.Description>
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

export const IntentInfo: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Show info
        </Button>
      </Modal.Trigger>
      <Modal.Content size="sm">
        <Modal.Header>
          <Modal.FeaturedIcon icon={InfoCircle} color="brand" theme="modern" />
          <Modal.Title>What&apos;s new in Glaon 1.4</Modal.Title>
          <Modal.Description>
            We&apos;ve added device groups, scene previews, and faster pairing for Matter devices.
          </Modal.Description>
        </Modal.Header>
        <Modal.Footer align="center">
          <Button color="primary" size="sm">
            Got it
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

// ─── Footer alignment variants ───────────────────────────────────────────

export const FooterCenter: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Centered actions
        </Button>
      </Modal.Trigger>
      <Modal.Content size="sm">
        <Modal.Header>
          <Modal.FeaturedIcon icon={CheckCircle} color="success" theme="light" />
          <Modal.Title>All synced</Modal.Title>
          <Modal.Description>Single CTA, centred under a featured icon.</Modal.Description>
        </Modal.Header>
        <Modal.Footer align="center">
          <Button color="primary" size="sm">
            Done
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const FooterBetween: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Step navigation
        </Button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>Step 2 of 3</Modal.Title>
          <Modal.Description>Configure the device&apos;s network settings.</Modal.Description>
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-secondary">
            Use align=&ldquo;between&rdquo; for wizard-style flows where the back action lives on
            the left and the forward action on the right.
          </p>
        </Modal.Body>
        <Modal.Footer align="between">
          <Button color="secondary" size="sm">
            Back
          </Button>
          <Button color="primary" size="sm">
            Continue
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const FooterStacked: Story = {
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Mobile-style stack
        </Button>
      </Modal.Trigger>
      <Modal.Content size="sm">
        <Modal.Header>
          <Modal.FeaturedIcon icon={AlertTriangle} color="warning" theme="light" />
          <Modal.Title>Replace existing scene?</Modal.Title>
          <Modal.Description>
            A scene with this name already exists. The new one will overwrite it.
          </Modal.Description>
        </Modal.Header>
        <Modal.Footer align="stacked">
          <Button color="primary" size="sm">
            Replace
          </Button>
          <Button color="secondary" size="sm">
            Cancel
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

// `OpenState` carries the open-modal snapshot for Chromatic. We
// also opt this story OUT of the MDX `<Stories>` docs block via
// `parameters.docs.disable: true` — without it, the docs page
// renders the full-viewport modal alongside the other stories,
// covering everything below it. The Storybook navigator still
// lists the story for direct browsing + Chromatic snapshots
// continue to capture it. See #316 for the rationale.
export const OpenState: Story = {
  parameters: { docs: { disable: true } },
  args: { defaultOpen: true },
  render: (args) => (
    <Modal {...args}>
      <Modal.Trigger>
        <Button color="secondary" size="sm">
          Open modal
        </Button>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Header>
          <h2 className="text-lg font-semibold text-primary">Confirm action</h2>
          <p className="text-sm text-tertiary">This will permanently apply the change.</p>
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
