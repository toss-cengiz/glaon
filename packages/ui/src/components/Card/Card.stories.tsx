import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Button } from '../Button';
import { Card } from './Card';

// Explicit `Meta<typeof Card>` annotation (rather than `satisfies`)
// keeps storybook csf-internal types out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true`.
const meta: Meta<typeof Card> = {
  title: 'Web Primitives/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-card',
    },
  },
  args: {
    variant: 'default',
    interactive: false,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'elevated', 'muted'] },
    interactive: { control: 'boolean' },
    onPress: { control: false, action: 'pressed' },
    children: { control: false, table: { disable: true } },
    className: { control: false, table: { disable: true } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Card>;

const sampleBody = (
  <Card.Body>
    <p className="text-sm text-secondary">
      Cards group related content into a single tappable surface. They can host any combination of
      headers, bodies, and footers.
    </p>
  </Card.Body>
);

export const Default: Story = {
  args: { children: sampleBody },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: sampleBody,
  },
};

export const Muted: Story = {
  args: {
    variant: 'muted',
    children: sampleBody,
  },
};

export const Interactive: Story = {
  args: {
    interactive: true,
    children: sampleBody,
  },
};

export const WithHeaderFooter: Story = {
  args: {
    children: (
      <>
        <Card.Header>
          <h3 className="text-lg font-semibold text-primary">Project Glaon</h3>
          <p className="text-sm text-tertiary">Updated 2 hours ago</p>
        </Card.Header>
        <Card.Body>
          <p className="text-sm text-secondary">
            Secure custom frontend for Home Assistant. Web + wall tablet + mobile from a single
            monorepo.
          </p>
        </Card.Body>
        <Card.Footer>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button color="secondary" size="sm">
              Cancel
            </Button>
            <Button color="primary" size="sm">
              Open
            </Button>
          </div>
        </Card.Footer>
      </>
    ),
  },
};

export const InteractiveTile: Story = {
  args: {
    interactive: true,
    children: (
      <Card.Body>
        <h3 className="text-base font-semibold text-primary">Activate scene</h3>
        <p className="mt-1 text-sm text-tertiary">Living room — Movie night</p>
      </Card.Body>
    ),
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['default', 'elevated', 'muted'] as const).map((variant) => (
        <Card key={variant} variant={variant}>
          <Card.Body>
            <p className="text-sm font-medium text-primary">
              variant: <span className="font-mono">{variant}</span>
            </p>
          </Card.Body>
        </Card>
      ))}
    </div>
  ),
};
