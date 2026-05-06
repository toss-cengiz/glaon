import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { appCatalog } from './index';
import type { AppIconCategory } from './types';

// Storybook docs catalog for the app-icon registry. Phase D.1 ships
// application logos pulled from Figma's "Specialized icon collections"
// frame (https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1025-31781).
// Phase D.1.a fills the Browsers sub-set (6 glyphs).
//
// The story renders a searchable grid + a category filter so consumers
// can locate the glyph they need without memorising filenames.
const meta: Meta = {
  title: 'Foundations/App Icons',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1025-31781',
    },
    docs: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

const CATEGORIES: { value: 'all' | AppIconCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'browsers', label: 'Browsers' },
  { value: 'coding', label: 'Coding' },
  { value: 'design', label: 'Design' },
  { value: 'finance', label: 'Finance' },
  { value: 'messengers', label: 'Messengers' },
  { value: 'music', label: 'Music' },
  { value: 'os', label: 'OS' },
  { value: 'other', label: 'Other' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'social-networks', label: 'Social networks' },
  { value: 'video', label: 'Video' },
];

function CatalogGrid({ search, category }: { search: string; category: 'all' | AppIconCategory }) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appCatalog.filter((entry) => {
      if (category !== 'all' && entry.category !== category) return false;
      if (q.length === 0) return true;
      return entry.id.includes(q) || entry.label.toLowerCase().includes(q);
    });
  }, [search, category]);

  if (filtered.length === 0) {
    return (
      <p
        style={{
          padding: 32,
          color: 'var(--color-text-tertiary, #555)',
          textAlign: 'center',
        }}
      >
        No app icons match the current filter.
      </p>
    );
  }

  return (
    <ul
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 16,
        padding: 0,
        margin: 0,
        listStyle: 'none',
      }}
    >
      {filtered.map(({ id, label, Icon }) => {
        // Stable PascalCase export name from the kebab-case id.
        const importName = id
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('');
        return (
          <li
            key={id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              borderRadius: 12,
              background: 'var(--color-bg-secondary, #f7f7f7)',
              border: '1px solid var(--color-border-secondary, #e4e4e4)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-primary, #111)',
              }}
            >
              <Icon className="size-10" />
            </div>
            <div
              style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
              <code
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-tertiary, #555)',
                  background: 'var(--color-bg-primary, #fff)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  userSelect: 'all',
                }}
              >
                {`import { ${importName} } from '@glaon/ui'`}
              </code>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function CatalogPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | AppIconCategory>('all');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search app icons…"
          aria-label="Search app icons"
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-border-primary, #d5d7da)',
            fontSize: 14,
            flex: '1 1 240px',
            maxWidth: 320,
          }}
        />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            color: 'var(--color-text-secondary, #333)',
          }}
        >
          Category
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.currentTarget.value as 'all' | AppIconCategory);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--color-border-primary, #d5d7da)',
              fontSize: 14,
            }}
          >
            {CATEGORIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <CatalogGrid search={search} category={category} />
    </div>
  );
}

/**
 * Searchable grid of every app glyph the registry ships. Filter by
 * category or type a query to narrow the list; each tile renders the
 * glyph at 40px and shows the canonical
 * `import { App } from '@glaon/ui'` line for copy-paste.
 */
export const Catalog: Story = {
  render: () => <CatalogPage />,
};
