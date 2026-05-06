import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { getLocalTimeZone, parseDate, today } from '@internationalized/date';

import { defineControls } from '../_internal/controls';
import { DatePicker } from './DatePicker';
import { datePickerControls, datePickerExcludeFromArgs } from './DatePicker.controls';

const { args, argTypes } = defineControls(datePickerControls);

// Explicit `Meta<typeof DatePicker>` annotation (rather than
// `satisfies`) keeps RAC's deep `DatePickerProps<DateValue>`
// generic chain out of the exported `meta` signature — `tsc
// --noEmit` runs with `declaration: true`.
const meta: Meta<typeof DatePicker> = {
  title: 'Web Primitives/DatePicker',
  component: DatePicker,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-date-picker',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: 480, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const excludeFromArgs = datePickerExcludeFromArgs;

const TODAY = today(getLocalTimeZone());

export const Default: Story = {};

export const WithDefaultValue: Story = {
  args: { defaultValue: TODAY },
};

export const WithFixedDate: Story = {
  args: { defaultValue: parseDate('2025-12-15') },
};

export const Disabled: Story = {
  args: { defaultValue: TODAY, isDisabled: true },
};

export const Invalid: Story = {
  args: { defaultValue: TODAY, isInvalid: true },
};

export const ReadOnly: Story = {
  args: { defaultValue: TODAY, isReadOnly: true },
};

export const SizeMd: Story = {
  args: { defaultValue: TODAY, size: 'md' },
};

export const SizeLg: Story = {
  args: { defaultValue: TODAY, size: 'lg' },
};

// `WithMinMax` — caps the selectable range one week either side of
// today. `isDateUnavailable` (per-date callback) covers more granular
// constraints (e.g. blackout days); see RAC docs for that overload.
export const WithMinMax: Story = {
  args: {
    defaultValue: TODAY,
    minValue: TODAY.subtract({ days: 7 }),
    maxValue: TODAY.add({ days: 7 }),
  },
};
