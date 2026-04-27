// Smoke story for the Tailwind v4 + UUI theme adoption (#219, ADR-0013).
// Verifies that:
//   - Tailwind v4's `@import "tailwindcss"` + the UUI `theme.css` semantic
//     layer compile under the Storybook preview's Vite plugin chain
//     (`@tailwindcss/vite`).
//   - Both the UUI scale classes (`bg-brand-500`) and UUI semantic classes
//     (`bg-brand-solid`, `text-error-primary`, `text-fg-tertiary`) resolve
//     at runtime — those names are produced by `theme.css`'s `@theme`
//     block and are what the kit Button (#215) will render.
//   - Inter typography (loaded by `theme.css`'s `--font-body` token)
//     reaches text nodes.
//
// Once #215 imports the actual kit Button source this fixture stays as a
// quick visual reference for token-to-class wiring.

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

const SmokeSwatches = () => (
  <div className="flex flex-col gap-6 p-4">
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-fg-primary">UUI brand scale</h2>
      <div className="flex gap-2">
        {['50', '100', '300', '500', '700', '900'].map((step) => (
          <div
            key={step}
            className="flex h-16 w-16 items-end justify-center rounded-md p-2 text-xs font-medium"
            style={{ backgroundColor: `var(--color-brand-${step})` }}
          >
            <span className="rounded bg-white/80 px-1 text-fg-primary">{step}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-fg-tertiary">
        UUI <code className="font-mono">--color-brand-500</code> resolves under{' '}
        <code className="font-mono">@theme</code>; Glaon brand override comes in a follow-up slice.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-fg-primary">UUI semantic colors</h2>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-md bg-brand-solid px-3 py-2 text-white">brand-solid</span>
        <span className="rounded-md bg-error-solid px-3 py-2 text-white">error-solid</span>
        <span className="rounded-md bg-primary px-3 py-2 text-fg-primary ring-1 ring-secondary">
          surface-primary
        </span>
        <span className="rounded-md px-3 py-2 text-fg-tertiary ring-1 ring-secondary">
          fg-tertiary
        </span>
      </div>
      <p className="text-sm text-fg-tertiary">
        Kit Button source (#215) renders these semantic classes; resolved by{' '}
        <code className="font-mono">theme.css</code> via Tailwind v4&apos;s <code>@theme</code>{' '}
        block.
      </p>
    </section>
  </div>
);

const meta = {
  title: 'Foundations/Tailwind Smoke',
  component: SmokeSwatches,
  tags: ['autodocs'],
  parameters: {
    a11y: {
      // Color-contrast checks fire false positives on tonal swatches whose
      // foreground is a label, not body content. The fixture exists to
      // confirm Tailwind compile, not WCAG.
      config: { rules: [{ id: 'color-contrast', enabled: false }] },
    },
  },
} satisfies Meta<typeof SmokeSwatches>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
