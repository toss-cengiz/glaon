import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { defineControls } from '../_internal/controls';
import { BreadcrumbNative } from './Breadcrumb.native';
import { breadcrumbNativeControls } from './Breadcrumb.native.controls';

const { args, argTypes } = defineControls(breadcrumbNativeControls);

const noop = (): void => undefined;

const meta: Meta<typeof BreadcrumbNative> = {
  title: 'Mobile Primitives/Breadcrumb',
  component: BreadcrumbNative,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=mobile-primitives-breadcrumb',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <View style={{ width: 360, paddingHorizontal: 16, paddingTop: 12 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BreadcrumbNative>;

export const Default: Story = {
  args: {
    title: 'Living room',
    onBack: noop,
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Living room',
    subtitle: 'Home',
    onBack: noop,
  },
};

export const RootScreen: Story = {
  args: {
    title: 'Home',
  },
};

export const LongTitle: Story = {
  args: {
    title: 'Master bedroom — south-facing window with curtains',
    subtitle: 'Upstairs',
    onBack: noop,
  },
};
