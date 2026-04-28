import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { ProgressBar } from './ProgressBar';
import { progressBarControls, progressBarExcludeFromArgs } from './ProgressBar.controls';

const { args, argTypes } = defineControls(progressBarControls);

// Explicit `Meta<typeof ProgressBar>` annotation (rather than `satisfies`)
// keeps storybook's csf-internal types out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true` and trips
// TS2742 on inferred references to `storybook/internal/csf`.
//
// Phase 1.5: `args` + `argTypes` come from `ProgressBar.controls.ts`;
// `tags: ['autodocs']` removed because `ProgressBar.mdx` replaces
// the docs tab.
const meta: Meta<typeof ProgressBar> = {
  title: 'Web Primitives/ProgressBar',
  component: ProgressBar,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-progressbar',
    },
  },
  args,
  argTypes,
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const excludeFromArgs = progressBarExcludeFromArgs;

export const Default: Story = {};

export const Right: Story = {
  args: { labelPosition: 'right' },
};

export const Bottom: Story = {
  args: { labelPosition: 'bottom' },
};

export const TopFloating: Story = {
  args: { labelPosition: 'top-floating', value: 40 },
};

export const BottomFloating: Story = {
  args: { labelPosition: 'bottom-floating', value: 40 },
};

export const Empty: Story = {
  args: { value: 0 },
};

export const Complete: Story = {
  args: { value: 100 },
};

export const CustomFormatter: Story = {
  args: {
    value: 320,
    max: 500,
    valueFormatter: (v, _pct) => `${v.toString()} / 500 MB`,
  },
};

export const CustomRange: Story = {
  args: { min: 50, max: 200, value: 125 },
};
