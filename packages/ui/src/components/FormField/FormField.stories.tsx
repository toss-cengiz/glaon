import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { FormField, useFormFieldDescriptors } from './FormField';
import { formFieldControls, formFieldExcludeFromArgs } from './FormField.controls';

const { args, argTypes } = defineControls(formFieldControls);

const meta: Meta<typeof FormField> = {
  title: 'App Primitives/FormField',
  component: FormField,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1267-132204',
    },
  },
  args,
  argTypes,
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const excludeFromArgs = formFieldExcludeFromArgs;

import type { ReactNode } from 'react';

function PlainInput({ id, error, hint }: { id: string; error?: ReactNode; hint?: ReactNode }) {
  const { describedBy } = useFormFieldDescriptors(id);
  const hasError = error !== undefined && error !== null && error !== false;
  const hasHint = hint !== undefined && hint !== null && hint !== false;
  const description = describedBy(hasError, hasHint);
  return (
    <input
      id={id}
      type="text"
      placeholder="olivia@untitledui.com"
      aria-invalid={hasError}
      {...(description !== undefined ? { 'aria-describedby': description } : {})}
      className="w-full rounded-lg bg-primary px-3 py-2 text-md text-primary shadow-xs ring-1 ring-primary ring-inset focus:outline-hidden focus:ring-2 focus:ring-brand"
    />
  );
}

export const LabelOnly: Story = {
  render: (args) => (
    <FormField {...args}>
      <PlainInput id={args.htmlFor} />
    </FormField>
  ),
};

export const WithHint: Story = {
  args: {
    label: 'Email',
    htmlFor: 'email-input',
    hint: "We'll never share your email.",
  },
  render: (args) => (
    <FormField {...args}>
      <PlainInput id={args.htmlFor} hint={args.hint} />
    </FormField>
  ),
};

export const WithError: Story = {
  args: {
    label: 'Email',
    htmlFor: 'email-input',
    error: 'Enter a valid email address.',
  },
  render: (args) => (
    <FormField {...args}>
      <PlainInput id={args.htmlFor} error={args.error} />
    </FormField>
  ),
};

export const RequiredField: Story = {
  args: {
    label: 'Password',
    htmlFor: 'password-input',
    isRequired: true,
    hint: 'Must be at least 8 characters.',
  },
  render: (args) => (
    <FormField {...args}>
      <PlainInput id={args.htmlFor} hint={args.hint} />
    </FormField>
  ),
};
