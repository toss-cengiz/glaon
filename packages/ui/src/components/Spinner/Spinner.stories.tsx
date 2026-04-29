import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Spinner } from './Spinner';
import { spinnerControls, spinnerExcludeFromArgs } from './Spinner.controls';

const { args, argTypes } = defineControls(spinnerControls);

// Explicit `Meta<typeof Spinner>` annotation (rather than `satisfies`)
// keeps the kit's unexported `LoadingIndicatorProps` interface out of
// the exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true` and TS4023 fires when an exported `meta` resolves
// to a non-exported nominal type.
//
// Phase 1.5: `args` + `argTypes` come from `Spinner.controls.ts`;
// `tags: ['autodocs']` removed because `Spinner.mdx` replaces the
// docs tab.
const meta: Meta<typeof Spinner> = {
  title: 'Web Primitives/Spinner',
  component: Spinner,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-spinner',
    },
  },
  args,
  argTypes,
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const excludeFromArgs = spinnerExcludeFromArgs;

export const Default: Story = {};

export const LineSimple: Story = {
  args: { type: 'line-simple' },
};

export const LineSpinner: Story = {
  args: { type: 'line-spinner' },
};

export const DotCircle: Story = {
  args: { type: 'dot-circle' },
};

export const WithLabel: Story = {
  args: { type: 'line-spinner', size: 'md', label: 'Loading…' },
};

// Matrix stories iterate over a single prop and render every variant
// side by side; the Storybook controls panel hides the iterated prop
// (changing it on a matrix is meaningless — each instance owns its
// own value). Other props still flow through `{...args}`.
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size'] } },
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Spinner key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const Types: Story = {
  parameters: { controls: { exclude: ['type'] } },
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      {(['line-simple', 'line-spinner', 'dot-circle'] as const).map((type) => (
        <Spinner key={type} {...args} type={type} />
      ))}
    </div>
  ),
};
