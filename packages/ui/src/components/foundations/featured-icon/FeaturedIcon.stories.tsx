import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Lightbulb02 } from '@untitledui/icons';

import { FeaturedIcon } from './featured-icon';

// `Foundations/Featured Icon` — Storybook surface for the kit-raw
// FeaturedIcon primitive. Phase C of the icon registry rollout
// (#309): document the theme × color × size matrix so consumers
// (Alert, Notification, Modal, future device tiles) reach for the
// right combination without spelunking the kit source.
//
// FeaturedIcon ships as raw UUI source under `components/foundations/`
// (no Glaon wrap layer yet — see UUI Source Rule). Promotion to a
// publicly-exported wrapped primitive is a separate concern; this
// PR is docs-only. Stories therefore import the kit component
// directly and live alongside the source file.

const themes = ['light', 'gradient', 'dark', 'outline', 'modern', 'modern-neue'] as const;
const colors = ['brand', 'gray', 'success', 'warning', 'error'] as const;
const sizes = ['sm', 'md', 'lg', 'xl'] as const;

// Explicit `Meta<typeof FeaturedIcon>` annotation rather than
// `satisfies` keeps Storybook csf-internal types out of the exported
// `meta` signature — `tsc --noEmit` runs with `declaration: true`,
// and the kit-source primitive's prop interface isn't exported.
const meta: Meta<typeof FeaturedIcon> = {
  title: 'Foundations/Featured Icon',
  component: FeaturedIcon,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1025-31781',
    },
  },
  args: {
    icon: Lightbulb02,
    size: 'md',
    theme: 'light',
    color: 'brand',
  },
  argTypes: {
    icon: {
      control: false,
      description:
        'Icon component or React node rendered inside the chip. Pair with `@untitledui/icons` or the brand registry; the FeaturedIcon owns sizing and colour treatment.',
      table: { category: 'Content' },
    },
    size: {
      control: 'inline-radio',
      options: sizes,
      description:
        'Outer chip size. `sm` = 32px, `md` = 40px, `lg` = 48px, `xl` = 56px. Inner glyph scales accordingly.',
      table: { category: 'Style' },
    },
    theme: {
      control: 'select',
      options: themes,
      description:
        'Visual treatment. `light` (tinted background) and `modern` (raised on a primary surface) are the most common; `dark`, `gradient`, `outline`, `modern-neue` ship for richer marketing / dashboard contexts.',
      table: { category: 'Style' },
    },
    color: {
      control: 'inline-radio',
      options: colors,
      description:
        'Semantic colour role. Pairs with the surrounding context: `brand` for primary affordances, `success`/`warning`/`error` for state-bound messages, `gray` for neutral framing.',
      table: { category: 'Style' },
    },
    className: {
      control: false,
      description: 'Tailwind override hook for the outer chip.',
      table: { category: 'Style' },
    },
    children: {
      control: false,
      description:
        'Optional decorative content rendered alongside the glyph (e.g. a small status dot). Rare; prefer composition outside the chip.',
      table: { category: 'Content' },
    },
  },
} satisfies Meta<typeof FeaturedIcon>;

export default meta;
type Story = StoryObj<typeof FeaturedIcon>;

/**
 * Default rendering with the controls panel wired up — toggle
 * `theme`, `color`, and `size` to compare combinations.
 */
export const Default: Story = {};

/**
 * Every theme rendered side by side at the canonical `md` size with
 * the `brand` colour. Use this to pick a theme by visual weight,
 * then narrow colour + size in the controls panel above.
 */
export const ThemeMatrix: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Six themes the kit ships. `light` is the everyday default; `modern` and `modern-neue` add a raised chip for dashboards; `dark`, `gradient`, and `outline` lean into branded marketing surfaces.',
      },
    },
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 24,
        alignItems: 'center',
      }}
    >
      {themes.map((theme) => (
        <div
          key={theme}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: 12,
          }}
        >
          <FeaturedIcon icon={Lightbulb02} theme={theme} color="brand" size="md" />
          <code style={{ fontSize: 12, color: 'var(--color-text-tertiary, #555)' }}>{theme}</code>
        </div>
      ))}
    </div>
  ),
};

/**
 * Theme × colour matrix at the canonical `md` size. Surfaces every
 * supported pairing so a contributor can spot which combinations the
 * kit already styles (e.g. `outline` × `error`) without wiring an
 * ad-hoc story.
 */
export const ColorMatrix: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Theme rows × colour columns. The chip carries semantic meaning, so prefer matching the colour to the surrounding context (an alert in error state pairs with `color="error"`, etc.).',
      },
    },
  },
  render: () => (
    <table
      style={{
        borderCollapse: 'collapse',
      }}
    >
      <thead>
        <tr>
          <th
            style={{
              padding: 12,
              textAlign: 'left',
              fontSize: 12,
              color: 'var(--color-text-tertiary, #555)',
            }}
          >
            theme \ color
          </th>
          {colors.map((color) => (
            <th
              key={color}
              style={{
                padding: 12,
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--color-text-tertiary, #555)',
              }}
            >
              {color}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {themes.map((theme) => (
          <tr key={theme}>
            <td
              style={{
                padding: 12,
                fontSize: 12,
                color: 'var(--color-text-tertiary, #555)',
              }}
            >
              <code>{theme}</code>
            </td>
            {colors.map((color) => (
              <td key={color} style={{ padding: 12, textAlign: 'center' }}>
                <FeaturedIcon icon={Lightbulb02} theme={theme} color={color} size="md" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

/**
 * Size scale at a fixed `light × brand` treatment. Sizes step in
 * 8px increments — pair `sm` with inline labels, `xl` with empty
 * states or hero panels.
 */
export const SizeScale: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 24,
        alignItems: 'center',
      }}
    >
      {sizes.map((size) => (
        <div
          key={size}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FeaturedIcon icon={Lightbulb02} theme="light" color="brand" size={size} />
          <code style={{ fontSize: 12, color: 'var(--color-text-tertiary, #555)' }}>{size}</code>
        </div>
      ))}
    </div>
  ),
};
