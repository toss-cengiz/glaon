import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { getLocalTimeZone, parseDate, today } from '@internationalized/date';

import { defineControls } from '../_internal/controls';
import { Calendar } from './Calendar';
import { calendarControls, calendarExcludeFromArgs } from './Calendar.controls';

const { args, argTypes } = defineControls(calendarControls);

const meta: Meta<typeof Calendar> = {
  title: 'Web Primitives/Calendar',
  component: Calendar,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-calendar',
    },
  },
  args,
  argTypes,
  decorators: [
    // The kit Calendar's month/year navigation is wrapped in a `<header>`
    // element. With no enclosing landmark, axe treats it as the document
    // banner — and the Storybook iframe already has its own banner, which
    // trips `landmark-banner-is-top-level`. Wrap each story in a
    // `<section aria-label="Calendar">` so the kit header is scoped to a
    // section landmark instead.
    (Story) => (
      <section
        aria-label="Calendar"
        style={{ display: 'flex', justifyContent: 'center', padding: 24 }}
      >
        <Story />
      </section>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const excludeFromArgs = calendarExcludeFromArgs;

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

export const WithMinMax: Story = {
  args: {
    defaultValue: TODAY,
    minValue: TODAY.subtract({ days: 7 }),
    maxValue: TODAY.add({ days: 7 }),
  },
};

// Programmatic blackout: weekends are unavailable. The kit Calendar
// forwards `isDateUnavailable` to RAC, which paints the cell with the
// disabled colour scheme and blocks selection.
export const WithUnavailableDates: Story = {
  args: {
    defaultValue: TODAY,
    isDateUnavailable: (date) => {
      const day = date.toDate(getLocalTimeZone()).getDay();
      return day === 0 || day === 6;
    },
  },
};
