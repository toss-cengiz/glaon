import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Button } from '../Button';
import { Toast, useToast } from './Toast';
import { toastControls, toastExcludeFromArgs } from './Toast.controls';

const { args, argTypes } = defineControls(toastControls);

// Explicit `Meta<typeof Toast>` annotation (rather than `satisfies`)
// keeps the unexported helper interfaces (`ToastEntry`,
// `ToastContextValue`) out of the exported `meta` signature —
// `tsc --noEmit` runs with `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Toast.controls.ts`;
// `tags: ['autodocs']` removed because `Toast.mdx` replaces the
// docs tab.
const meta: Meta<typeof Toast> = {
  title: 'Web Primitives/Toast',
  component: Toast,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-toast',
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
type Story = StoryObj<typeof Toast>;

export const excludeFromArgs = toastExcludeFromArgs;

export const Default: Story = {};

export const Info: Story = {
  args: {
    intent: 'info',
    title: 'Heads up',
    description: 'New release Friday at 14:00 UTC.',
  },
};

export const Success: Story = {
  args: {
    intent: 'success',
    title: 'Saved',
    description: 'Settings stored.',
  },
};

export const Warning: Story = {
  args: {
    intent: 'warning',
    title: 'Token rotation in 24 hours',
    description: 'Re-authenticate before midnight.',
  },
};

export const Danger: Story = {
  args: {
    intent: 'danger',
    title: 'Could not save',
    description: 'Network error — try again.',
  },
};

export const WithAction: Story = {
  args: {
    intent: 'info',
    title: 'Device pairing started',
    description: 'You can monitor progress in the device list.',
    action: {
      label: 'Open list',
      onPress: () => {
        // eslint-disable-next-line no-console -- demo only
        console.log('open list');
      },
    },
  },
};

export const Persistent: Story = {
  args: {
    intent: 'warning',
    title: 'Manual dismissal required',
    description: 'This toast does not auto-dismiss (duration = 0).',
    duration: 0,
  },
};

export const NoCloseButton: Story = {
  args: {
    intent: 'info',
    title: 'Cleaner card',
    description: 'Hide the close button when an action is the only dismissal path.',
    hideClose: true,
    action: {
      label: 'Acknowledge',
      onPress: () => {
        // eslint-disable-next-line no-console -- demo only
        console.log('ack');
      },
    },
  },
};

// `useToast()` queue demo — clicks fire imperative `show()` calls
// against the `ToastProvider` mounted by the Storybook decorator.
function QueueDemo() {
  const { show } = useToast();
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button
        color="primary"
        size="sm"
        onClick={() => {
          show({
            intent: 'success',
            title: 'Saved',
            description: 'Configuration applied.',
            duration: 4000,
          });
        }}
      >
        Show success toast
      </Button>
      <Button
        color="secondary"
        size="sm"
        onClick={() => {
          show({
            intent: 'danger',
            title: 'Connection lost',
            description: 'Reconnecting in the background…',
            duration: 6000,
          });
        }}
      >
        Show danger toast
      </Button>
      <Button
        color="secondary"
        size="sm"
        onClick={() => {
          show({
            intent: 'info',
            title: 'Update available',
            description: 'A newer version is ready to install.',
            duration: 0,
            action: {
              label: 'Install',
              onPress: () => {
                // eslint-disable-next-line no-console -- demo only
                console.log('install');
              },
            },
          });
        }}
      >
        Show toast with action (persistent)
      </Button>
    </div>
  );
}

export const Stack: Story = {
  render: () => <QueueDemo />,
};
