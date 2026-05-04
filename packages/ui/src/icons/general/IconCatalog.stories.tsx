import type { ComponentType, SVGProps } from 'react';
import { useMemo, useState } from 'react';
import * as UntitledIcons from '@untitledui/icons';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { groupByCategory } from './categories';

// `Foundations / Icons / General` — searchable, categorised browser
// over the entire `@untitledui/icons` export set (~1,179 glyphs at
// the time of writing). Phase B of the icon registry rollout (#309)
// — gives every UI contributor a single page to answer "which icon
// name should I import?" without grepping node_modules. The curated
// `storybookIcons` map (packages/ui/src/icons/storybook.ts) stays —
// it powers component-story `select` controls and is intentionally
// small. This catalog is the long-form companion.
//
// The catalog disables Chromatic snapshots (the icon set is
// upstream + rendered live, so a baseline diff would break on every
// kit bump that adds a glyph). Surface-level accessibility (search
// input label, list semantics) still gets the Storybook a11y addon
// gate.

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const ALL_ICONS = Object.entries(UntitledIcons as Record<string, IconComponent>)
  .filter(([, Icon]) => typeof Icon === 'function')
  .sort(([a], [b]) => a.localeCompare(b));

const ALL_ICON_NAMES = ALL_ICONS.map(([name]) => name);
const TOTAL_COUNT = ALL_ICONS.length;
const ICONS_BY_NAME = new Map<string, IconComponent>(ALL_ICONS);

interface IconTileProps {
  name: string;
  Icon: IconComponent;
}

function IconTile({ name, Icon }: IconTileProps) {
  const importLine = `import { ${name} } from '@untitledui/icons';`;

  return (
    <li
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        background: 'var(--color-bg-secondary, #f7f7f7)',
        border: '1px solid var(--color-border-secondary, #e4e4e4)',
        minHeight: 132,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-primary, #111)',
        }}
      >
        <Icon className="size-8" />
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--color-text-primary, #111)',
          textAlign: 'center',
          wordBreak: 'break-word',
        }}
      >
        {name}
      </span>
      <code
        title={importLine}
        style={{
          fontSize: 10,
          color: 'var(--color-text-tertiary, #555)',
          background: 'var(--color-bg-primary, #fff)',
          padding: '2px 6px',
          borderRadius: 4,
          userSelect: 'all',
          textAlign: 'center',
          wordBreak: 'break-all',
        }}
      >
        {importLine}
      </code>
    </li>
  );
}

interface CategorySectionProps {
  id: string;
  label: string;
  icons: readonly string[];
}

function CategorySection({ id, label, icons }: CategorySectionProps) {
  if (icons.length === 0) return null;
  return (
    <section
      aria-labelledby={`icon-cat-${id}`}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <h3
          id={`icon-cat-${id}`}
          style={{
            fontSize: 14,
            fontWeight: 600,
            margin: 0,
            color: 'var(--color-text-primary, #111)',
          }}
        >
          {label}
        </h3>
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary, #555)' }}>
          {icons.length}
        </span>
      </header>
      <ul
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
          padding: 0,
          margin: 0,
          listStyle: 'none',
        }}
      >
        {icons.map((name) => {
          const Icon = ICONS_BY_NAME.get(name);
          if (Icon === undefined) return null;
          return <IconTile key={name} name={name} Icon={Icon} />;
        })}
      </ul>
    </section>
  );
}

function CatalogPage() {
  const [search, setSearch] = useState('');

  const filteredNames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length === 0) return ALL_ICON_NAMES;
    return ALL_ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  const groups = useMemo(() => groupByCategory(filteredNames), [filteredNames]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label
          htmlFor="icon-catalog-search"
          style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary, #444)' }}
        >
          Search
        </label>
        <input
          id="icon-catalog-search"
          type="search"
          placeholder="e.g. arrow, alert, mail…"
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-border-primary, #d5d7da)',
            fontSize: 14,
            width: '100%',
            maxWidth: 360,
          }}
        />
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary, #555)', margin: 0 }}>
          {`Showing ${String(filteredNames.length)} of ${String(TOTAL_COUNT)} icons.`}
          {search.trim().length > 0 && filteredNames.length === 0 ? (
            <span style={{ marginLeft: 6 }}>{`No icons match "${search}".`}</span>
          ) : null}
        </p>
      </div>
      {groups.map(({ category, icons }) => (
        <CategorySection key={category.id} id={category.id} label={category.label} icons={icons} />
      ))}
    </div>
  );
}

const meta: Meta = {
  title: 'Foundations/Icons/General',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=3463-407484',
    },
    docs: { disable: true },
    chromatic: { disableSnapshot: true },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Browse every icon `@untitledui/icons` exports. Type to filter by
 * name (case-insensitive substring); each tile shows the canonical
 * `import { Name } from '@untitledui/icons'` line for copy-paste.
 * Categories are heuristic — see `categories.ts`.
 */
export const Catalog: Story = {
  render: () => <CatalogPage />,
};
