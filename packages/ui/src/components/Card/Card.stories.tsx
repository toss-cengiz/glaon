import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { defineControls } from '../_internal/controls';
import { Button } from '../Button';
import { Card } from './Card';
import { cardControls, cardExcludeFromArgs } from './Card.controls';

const { args, argTypes } = defineControls(cardControls);

// Explicit `Meta<typeof Card>` annotation (rather than `satisfies`)
// keeps storybook csf-internal types out of the exported `meta`
// signature — `tsc --noEmit` runs with `declaration: true`.
//
// Phase 1.5: `args` + `argTypes` come from `Card.controls.ts`;
// `tags: ['autodocs']` removed because `Card.mdx` replaces the
// docs tab.
const meta: Meta<typeof Card> = {
  title: 'Web Primitives/Card',
  component: Card,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=web-primitives-card',
    },
  },
  args,
  argTypes,
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

export const excludeFromArgs = cardExcludeFromArgs;

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

// Matrix story: iterates `variant` and renders every option in a
// single canvas, so the controls panel hides `variant`. The render
// fn ignores `args` (each Card hard-codes its content) — keep the
// remaining controls disabled too via the rest of the `exclude` list
// is unnecessary here because no other prop matters.
export const Variants: Story = {
  parameters: { controls: { exclude: ['variant'] } },
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
