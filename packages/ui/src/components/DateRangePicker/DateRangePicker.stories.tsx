import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { getLocalTimeZone, today } from '@internationalized/date';

import { defineControls } from '../_internal/controls';
import { DateRangePicker } from './DateRangePicker';
import {
  dateRangePickerControls,
  dateRangePickerExcludeFromArgs,
} from './DateRangePicker.controls';

const { args, argTypes } = defineControls(dateRangePickerControls);

const meta: Meta<typeof DateRangePicker> = {
  title: 'Web Primitives/DateRangePicker',
  component: DateRangePicker,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-date-range-picker',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: 540, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

export const excludeFromArgs = dateRangePickerExcludeFromArgs;

const TODAY = today(getLocalTimeZone());
const SEVEN_DAYS_AGO = TODAY.subtract({ days: 7 });

export const Default: Story = {};

export const WithDefaultRange: Story = {
  args: { defaultValue: { start: SEVEN_DAYS_AGO, end: TODAY } },
};

export const Disabled: Story = {
  args: {
    defaultValue: { start: SEVEN_DAYS_AGO, end: TODAY },
    isDisabled: true,
  },
};

export const Invalid: Story = {
  args: {
    defaultValue: { start: SEVEN_DAYS_AGO, end: TODAY },
    isInvalid: true,
  },
};

export const ReadOnly: Story = {
  args: {
    defaultValue: { start: SEVEN_DAYS_AGO, end: TODAY },
    isReadOnly: true,
  },
};

export const SizeMd: Story = {
  args: {
    defaultValue: { start: SEVEN_DAYS_AGO, end: TODAY },
    size: 'md',
  },
};

export const SizeLg: Story = {
  args: {
    defaultValue: { start: SEVEN_DAYS_AGO, end: TODAY },
    size: 'lg',
  },
};

export const WithMinMax: Story = {
  args: {
    defaultValue: { start: SEVEN_DAYS_AGO, end: TODAY },
    minValue: TODAY.subtract({ days: 30 }),
    maxValue: TODAY.add({ days: 30 }),
  },
};
