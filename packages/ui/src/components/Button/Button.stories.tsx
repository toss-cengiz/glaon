import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { storybookIcons } from '../../icons/storybook';
import { Button } from './Button';
import { buttonControls, buttonExcludeFromArgs } from './Button.controls';

const { args, argTypes } = defineControls(buttonControls);

// Explicit `Meta<typeof Button>` annotation (rather than `satisfies`)
// keeps the kit's unexported `ButtonProps` interface out of the
// exported `meta` signature — `tsc --noEmit` runs with
// `declaration: true`.
//
// #307: Phase 1.5 conversion — `args` + `argTypes` come from
// `Button.controls.ts`; `tags: ['autodocs']` removed because
// `Button.mdx` replaces the docs tab.
const meta: Meta<typeof Button> = {
  title: 'Web Primitives/Button',
  component: Button,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-button',
    },
  },
  args,
  argTypes,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const excludeFromArgs = buttonExcludeFromArgs;

export const Default: Story = {};

export const Primary: Story = {
  args: { color: 'primary' },
};

export const Secondary: Story = {
  args: { color: 'secondary' },
};

export const Tertiary: Story = {
  args: { color: 'tertiary' },
};

export const PrimaryDestructive: Story = {
  args: { color: 'primary-destructive', children: 'Delete' },
};

export const SecondaryDestructive: Story = {
  args: { color: 'secondary-destructive', children: 'Delete' },
};

export const TertiaryDestructive: Story = {
  args: { color: 'tertiary-destructive', children: 'Delete' },
};

export const LinkColor: Story = {
  args: { color: 'link-color', children: 'Read more' },
};

export const LinkGray: Story = {
  args: { color: 'link-gray', children: 'Read more' },
};

export const LinkDestructive: Story = {
  args: { color: 'link-destructive', children: 'Remove' },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Saving',
    // The kit hides the label visually while loading (only the spinner
    // shows). Surface it to assistive tech via aria-label so axe's
    // `button-name` rule still passes.
    'aria-label': 'Saving',
  },
};

export const LoadingWithText: Story = {
  args: { isLoading: true, showTextWhileLoading: true, children: 'Saving' },
};

export const WithLeadingIcon: Story = {
  args: { iconLeading: storybookIcons.plus, children: 'Add item' },
};

export const WithTrailingIcon: Story = {
  args: { iconTrailing: storybookIcons.arrowRight, children: 'Continue' },
};

// Icon-only button: kit auto-detects this when `iconLeading` is set
// AND `children` is empty/undefined — applies square padding via
// `data-icon-only`. Always pair with `aria-label` so axe `button-name`
// passes (the visible label is the icon, not text).
export const IconOnly: Story = {
  args: {
    children: undefined,
    iconLeading: storybookIcons.settings,
    'aria-label': 'Settings',
  },
};

// Matrix stories iterate over a single prop and render every variant
// side by side; the Storybook controls panel hides the iterated prop
// because changing it on a matrix is meaningless. Other props still
// flow through `{...args}`.
export const Sizes: Story = {
  parameters: { controls: { exclude: ['size', 'children'] } },
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Button key={size} {...args} size={size}>
          {size.toUpperCase()}
        </Button>
      ))}
    </div>
  ),
};

export const Colors: Story = {
  parameters: { controls: { exclude: ['color', 'children'] } },
  render: (args) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, max-content)',
        gap: 12,
        alignItems: 'center',
      }}
    >
      {(
        [
          'primary',
          'secondary',
          'tertiary',
          'primary-destructive',
          'secondary-destructive',
          'tertiary-destructive',
          'link-color',
          'link-gray',
          'link-destructive',
        ] as const
      ).map((color) => (
        <Button key={color} {...args} color={color}>
          {color}
        </Button>
      ))}
    </div>
  ),
};
