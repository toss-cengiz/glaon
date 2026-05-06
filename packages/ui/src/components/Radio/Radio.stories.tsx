import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';
import { radioControls, radioExcludeFromArgs } from './Radio.controls';

const { args, argTypes } = defineControls(radioControls);

// Explicit `Meta<typeof Radio>` annotation (rather than `satisfies`)
// keeps the kit's unexported `RadioButtonProps` interface out of the
// exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Radio.controls.ts`;
// `tags: ['autodocs']` removed because `Radio.mdx` replaces the
// docs tab.
const meta: Meta<typeof Radio> = {
  title: 'Web Primitives/Radio',
  component: Radio,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-radio',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <RadioGroup defaultValue="email" aria-label="Notification channel">
        <Story />
      </RadioGroup>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Radio>;

export const excludeFromArgs = radioExcludeFromArgs;

export const Default: Story = {};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const WithHint: Story = {
  args: {
    label: 'Email notifications',
    hint: 'Receive a digest every Monday.',
  },
};

export const InGroup: Story = {
  decorators: [
    () => (
      <RadioGroup defaultValue="email" aria-label="Notification channel">
        <Radio value="email" label="Email" hint="A weekly digest." />
        <Radio value="sms" label="SMS" hint="Immediate alerts." />
        <Radio value="push" label="Push" hint="App-only notifications." />
        <Radio value="none" label="None" isDisabled />
      </RadioGroup>
    ),
  ],
};

// Matrix story: iterates `size` (driven by `<RadioGroup>`) and
// renders every variant in a single canvas. The render fn ignores
// `args` (each group hard-codes its content), so hide the iterated
// prop and the per-Radio `label` knob that's overridden inline.
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size', 'label'] } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['sm', 'md'] as const).map((size) => (
        <RadioGroup key={size} size={size} defaultValue="a" aria-label={`Group ${size}`}>
          <Radio value="a" label={`Option A — size ${size}`} />
          <Radio value="b" label={`Option B — size ${size}`} />
        </RadioGroup>
      ))}
    </div>
  ),
};

// ─── Card variant stories ───────────────────────────────────────────────
//
// `Radio.Card` swaps the flat row layout for a bordered tile with
// title + description + optional trailing slot. The card itself is
// the click target; selected state lights up the brand border + bg.
// RadioGroup form-row features (label/description/errorMessage,
// orientation) are exercised in the dedicated RadioGroup stories.

export const CardBasic: Story = {
  decorators: [
    () => (
      <RadioGroup aria-label="Plan" defaultValue="starter">
        <Radio.Card value="free" label="Free" description="$0 / month" />
        <Radio.Card value="starter" label="Starter" description="$10 / month" />
        <Radio.Card value="pro" label="Pro" description="$30 / month" />
      </RadioGroup>
    ),
  ],
};

export const CardSelected: Story = {
  decorators: [
    () => (
      <RadioGroup aria-label="Plan" defaultValue="pro">
        <Radio.Card value="free" label="Free" description="$0 / month" />
        <Radio.Card value="starter" label="Starter" description="$10 / month" />
        <Radio.Card value="pro" label="Pro" description="$30 / month — includes priority support" />
      </RadioGroup>
    ),
  ],
};

export const CardWithTrailing: Story = {
  decorators: [
    () => (
      <RadioGroup aria-label="Plan" defaultValue="pro">
        <Radio.Card
          value="starter"
          label="Starter"
          description="$10 / month"
          trailing={<span className="text-xs font-semibold text-tertiary">10 seats</span>}
        />
        <Radio.Card
          value="pro"
          label="Pro"
          description="$30 / month"
          trailing={
            // `bg-brand-solid` is the opaque dark-brand chip surface;
            // `bg-brand-primary` is a tinted/light token that fails axe
            // `color-contrast` against `text-white` (1.92:1).
            <span className="rounded-full bg-brand-solid px-2 py-0.5 text-xs font-semibold text-white">
              Popular
            </span>
          }
        />
        <Radio.Card
          value="enterprise"
          label="Enterprise"
          description="Contact sales"
          trailing={<span className="text-xs font-semibold text-tertiary">Custom</span>}
        />
      </RadioGroup>
    ),
  ],
};

export const CardDisabled: Story = {
  decorators: [
    () => (
      <RadioGroup aria-label="Plan" defaultValue="starter">
        <Radio.Card value="starter" label="Starter" description="$10 / month" />
        <Radio.Card
          value="pro"
          label="Pro (waitlist)"
          description="Currently invite-only"
          isDisabled
        />
        <Radio.Card value="enterprise" label="Enterprise" description="Contact sales" />
      </RadioGroup>
    ),
  ],
};
