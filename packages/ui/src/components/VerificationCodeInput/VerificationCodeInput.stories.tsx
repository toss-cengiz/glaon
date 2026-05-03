import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { VerificationCodeInput } from './VerificationCodeInput';
import {
  verificationCodeInputControls,
  verificationCodeInputExcludeFromArgs,
} from './VerificationCodeInput.controls';

const { args, argTypes } = defineControls(verificationCodeInputControls);

const meta: Meta<typeof VerificationCodeInput> = {
  title: 'Web Primitives/VerificationCodeInput',
  component: VerificationCodeInput,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=85-1269',
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
type Story = StoryObj<typeof VerificationCodeInput>;

export const excludeFromArgs = verificationCodeInputExcludeFromArgs;

export const Default: Story = {
  args: { hint: 'We sent a code to +90 555 555 55 55' },
};

// `digits=4` for shorter codes (PIN entry, simple captchas).
export const FourDigits: Story = {
  args: { digits: 4, label: 'PIN', ariaLabel: 'PIN' },
};

// Side-by-side size matrix — `sm` for in-line confirm cards, `md`
// (default) for dedicated screens, `lg` for splash / boot flows.
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <VerificationCodeInput
          key={size}
          {...args}
          size={size}
          label={`Size: ${size}`}
          ariaLabel={`Size ${size} verification`}
        />
      ))}
    </div>
  ),
};

// `isInvalid` re-styles every cell to the error ring AND wires
// `aria-invalid` per cell.
export const WithError: Story = {
  args: {
    isInvalid: true,
    defaultValue: '123456',
    hint: 'Code expired. Request a new one.',
  },
};

// `isDisabled` on the parent disables every cell — the row becomes
// un-tabbable in one shot.
export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: '4242' },
};

// Pre-populated value — confirms paste-style autofill works with
// uncontrolled state. Each cell mirrors a digit; the first carries
// `autocomplete="one-time-code"` so iOS Safari can offer the SMS
// suggestion.
export const Prefilled: Story = {
  args: { defaultValue: '123456' },
};
