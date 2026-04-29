import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { storybookIcons } from '../../icons/storybook';
import { Button } from './Button';

const meta = {
  title: 'Web Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-button',
    },
  },
  args: {
    children: 'Click me',
    size: 'sm',
    color: 'primary',
    isDisabled: false,
    isLoading: false,
    showTextWhileLoading: false,
    noTextPadding: false,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    color: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'tertiary',
        'primary-destructive',
        'secondary-destructive',
        'tertiary-destructive',
        'link-color',
        'link-gray',
        'link-destructive',
      ],
    },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    showTextWhileLoading: { control: 'boolean' },
    noTextPadding: { control: 'boolean' },
    iconLeading: {
      control: 'select',
      options: Object.keys(storybookIcons),
      mapping: storybookIcons,
    },
    iconTrailing: {
      control: 'select',
      options: Object.keys(storybookIcons),
      mapping: storybookIcons,
    },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Props on the kit Button that are reachable through type-checking but
// have no useful Storybook control surface. The F6 prop-coverage gate
// (`src/__tests__/prop-coverage.test.ts`) reads this list to satisfy
// the "every prop covered" rule without polluting the controls panel.
export const excludeFromArgs = [
  // react-aria-components slot binding; only meaningful in `slots`-aware
  // composites, not as a Storybook knob.
  'slot',
  // Forwarded only when the link variant (`href`) is used; not a knob.
  'routerOptions',
];

export const Primary: Story = {
  args: {
    color: 'tertiary',
  },
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

export const LinkColor: Story = {
  args: { color: 'link-color', children: 'Read more' },
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
