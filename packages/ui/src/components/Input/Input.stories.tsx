import type { ComponentType, HTMLAttributes } from 'react';

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';
import { Input } from './Input';
import { inputControls, inputExcludeFromArgs } from './Input.controls';

// The kit `Input` typed `icon` as `ComponentType<HTMLAttributes<...>>`
// while our shared picker (`icons/storybook.ts`) is typed loosely as
// `FC<any> | undefined`. Cast here once so individual stories don't
// need to repeat it; the runtime icons are real components.
type InputIcon = ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
const icon = (name: keyof typeof storybookIcons): InputIcon => storybookIcons[name] as InputIcon;

const { args, argTypes } = defineControls(inputControls);

// Explicit `Meta<typeof Input>` annotation (rather than `satisfies`)
// keeps the kit's unexported deep prop shapes (RAC `TextFieldProps`)
// out of the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true` and trips TS4023 / TS2742 when the inferred
// meta references types that aren't portably named.
//
// Phase 1.5: `args` + `argTypes` come from `Input.controls.ts`;
// `tags: ['autodocs']` removed because `Input.mdx` replaces the
// docs tab.
const meta: Meta<typeof Input> = {
  title: 'Web Primitives/Input',
  component: Input,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-input',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const excludeFromArgs = inputExcludeFromArgs;

export const Default: Story = {};

export const WithHelper: Story = {
  args: {
    hint: 'We will only use this address to send you order updates.',
  },
};

export const WithError: Story = {
  args: {
    hint: 'Enter a valid email address.',
    isInvalid: true,
    defaultValue: 'not-an-email',
  },
};

export const Disabled: Story = {
  args: { isDisabled: true, value: 'olivia@untitledui.com' },
};

export const ReadOnly: Story = {
  args: { isReadOnly: true, value: 'olivia@untitledui.com' },
};

export const Required: Story = {
  args: { isRequired: true },
};

export const WithLeadingIcon: Story = {
  args: { icon: icon('mail'), type: 'email' },
};

export const WithShortcut: Story = {
  args: { shortcut: '⌘ K', icon: icon('search'), label: 'Search' },
};

export const WithTooltip: Story = {
  args: {
    tooltip: 'We use this to send you receipts and login codes.',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    label: 'Password',
    placeholder: '••••••••',
    defaultValue: 'secret-token',
  },
};

// Matrix story: iterates `size` and renders every variant in a
// single canvas, so the controls panel hides `size` and the
// per-instance `label` (which is overridden by `Size: ${size}`).
// Other props still flow through `{...args}`.
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size', 'label'] } },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Input key={size} {...args} size={size} label={`Size: ${size}`} />
      ))}
    </div>
  ),
};

// `variant='leading-text'` — static prefix inside the surface. Use
// for fixed URL prefixes, country codes, or any decoration that
// should sit visually attached to the input.
export const WithLeadingText: Story = {
  args: {
    variant: 'leading-text',
    label: 'Website',
    leadingText: 'https://',
    placeholder: 'example.com',
  },
};

// `variant='trailing-button'` — inline submit button. Use for
// inline coupon redeem, search submit, or quick-send actions.
export const WithTrailingButton: Story = {
  args: {
    variant: 'trailing-button',
    label: 'Promo code',
    placeholder: 'GLAON-2026',
    trailingButtonLabel: 'Apply',
  },
};

// `variant='leading-dropdown'` — inline `<select>` on the leading
// edge. Pair with phone numbers (country code), URLs (scheme), or
// any prefix that comes from a fixed enum.
export const WithLeadingDropdown: Story = {
  args: {
    variant: 'leading-dropdown',
    label: 'Phone',
    placeholder: '555 555 55 55',
    dropdownAriaLabel: 'Country code',
    defaultDropdownValue: '+90',
    dropdownOptions: [
      { value: '+90', label: 'TR +90' },
      { value: '+44', label: 'UK +44' },
      { value: '+1', label: 'US +1' },
      { value: '+49', label: 'DE +49' },
    ],
  },
};

// `variant='trailing-dropdown'` — inline `<select>` on the trailing
// edge. Currency / unit pickers attached to a numeric input are the
// canonical use case.
export const WithTrailingDropdown: Story = {
  args: {
    variant: 'trailing-dropdown',
    label: 'Amount',
    placeholder: '0.00',
    type: 'number',
    dropdownAriaLabel: 'Currency',
    defaultDropdownValue: 'USD',
    dropdownOptions: [
      { value: 'USD', label: 'USD' },
      { value: 'EUR', label: 'EUR' },
      { value: 'GBP', label: 'GBP' },
      { value: 'TRY', label: 'TRY' },
    ],
  },
};

// `variant='payment'` — masked card number with brand auto-detect.
// AMEX uses 4-6-5 grouping; everyone else gets 4-4-4-4. The
// detected brand surfaces via `aria-label` and the
// `onPaymentBrandDetected` callback.
export const PaymentInput: Story = {
  args: {
    variant: 'payment',
    label: 'Card number',
    placeholder: '1234 1234 1234 1234',
    defaultValue: '4242424242424242',
  },
};

// `variant='tags-inner'` — chip-based multi-value capture sharing
// the same surface ring as the default Input. Mirrors the
// `<Textarea variant='tags-inner'>` keyboard contract: Enter / `,`
// confirms, Backspace on empty pops last, Paste with separator
// bulk-adds.
export const TagsInner: Story = {
  args: {
    variant: 'tags-inner',
    label: 'Recipients',
    placeholder: 'Add an email and press Enter…',
    defaultTags: ['alice@example.com', 'bob@example.com'],
  },
};

// Side-by-side variant gallery so designers can verify the seven
// surfaces look like family members — same ring + focus + invalid
// affordances, just different slot layouts.
export const Variants: Story = {
  parameters: {
    controls: {
      exclude: [
        'variant',
        'label',
        'placeholder',
        'leadingText',
        'dropdownOptions',
        'defaultDropdownValue',
        'dropdownAriaLabel',
        'trailingButtonLabel',
        'defaultTags',
        'defaultValue',
      ],
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input variant="default" label="Default" placeholder="Plain input" />
      <Input
        variant="leading-text"
        label="Leading text"
        leadingText="https://"
        placeholder="example.com"
      />
      <Input
        variant="trailing-button"
        label="Trailing button"
        placeholder="Coupon code"
        trailingButtonLabel="Apply"
      />
      <Input
        variant="leading-dropdown"
        label="Leading dropdown"
        placeholder="555 555 55 55"
        dropdownAriaLabel="Country code"
        defaultDropdownValue="+90"
        dropdownOptions={[
          { value: '+90', label: 'TR +90' },
          { value: '+44', label: 'UK +44' },
        ]}
      />
      <Input
        variant="trailing-dropdown"
        label="Trailing dropdown"
        placeholder="0.00"
        dropdownAriaLabel="Currency"
        defaultDropdownValue="USD"
        dropdownOptions={[
          { value: 'USD', label: 'USD' },
          { value: 'EUR', label: 'EUR' },
        ]}
      />
      <Input
        variant="payment"
        label="Payment"
        placeholder="1234 1234 1234 1234"
        defaultValue="4242424242424242"
      />
      <Input
        variant="tags-inner"
        label="Tags inner"
        placeholder="Add a tag…"
        defaultTags={['frontend', 'tooling']}
      />
    </div>
  ),
};
