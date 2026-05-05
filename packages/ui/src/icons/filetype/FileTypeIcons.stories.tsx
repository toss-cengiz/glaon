import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { fileTypeCatalog } from './index';
import type { FileTypeCategory, FileTypeIconCatalogEntry } from './types';

// Storybook docs catalog for the file-type icon registry.
// Phase D.4.a ships document / spreadsheet / presentation; D.4.b
// follows with image / audio / video; D.4.c with archive / code /
// other. Mirrors the brand / payment / integration catalog page
// layout for visual consistency.
//
// Cross-link: `<Table.Cell.FileTypeIcon>` (#324 Phase A) consumes
// these glyphs via the `fileTypeIconForExtension(ext)` helper —
// pass a filename and the cell auto-routes to the right glyph.

type CategoryFilter = 'all' | FileTypeCategory;

const meta: Meta = {
  title: 'Foundations/File Type Icons',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1025-31781',
    },
    // Docs-only sketch — no canvas snapshot diff because the icon
    // set isn't a behavioural primitive. Per-icon per-PR review
    // covers visual correctness; downstream Table cell stories
    // capture the integration moment.
    docs: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

function CatalogGrid({ search, category }: { search: string; category: CategoryFilter }) {
  const filtered = useMemo<readonly FileTypeIconCatalogEntry[]>(() => {
    const q = search.trim().toLowerCase();
    return fileTypeCatalog.filter((entry) => {
      const matchesCategory = category === 'all' || entry.category === category;
      const matchesSearch =
        q.length === 0 || entry.id.includes(q) || entry.label.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
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
        No file-type glyphs match the current filter.
      </p>
    );
  }

  return (
    <ul
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 16,
        padding: 0,
        margin: 0,
        listStyle: 'none',
      }}
    >
      {filtered.map(({ id, label, Icon }) => (
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
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon className="h-12" />
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
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
              {`import { ${componentName(id)} } from '@glaon/ui'`}
            </code>
          </div>
        </li>
      ))}
    </ul>
  );
}

function componentName(id: string): string {
  // ids are bare file extensions; component names are PascalCase
  // with `File` suffix (e.g. `pdf` → `PdfFile`, `numbers` →
  // `NumbersFile`).
  const head = id.charAt(0);
  const titleCase = head.length > 0 ? head.toUpperCase() + id.slice(1) : '';
  return `${titleCase}File`;
}

function CatalogPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const filterButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid var(--color-border-primary, #d5d7da)',
    background: active ? 'var(--color-bg-brand-solid, #6941C6)' : 'var(--color-bg-primary, #fff)',
    color: active ? '#fff' : 'var(--color-text-secondary, #555)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search file-type glyphs…"
          aria-label="Search file-type glyphs"
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-border-primary, #d5d7da)',
            fontSize: 14,
            flex: 1,
            minWidth: 200,
            maxWidth: 320,
          }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(
            [
              ['all', 'All'],
              ['document', 'Document'],
              ['spreadsheet', 'Spreadsheet'],
              ['presentation', 'Presentation'],
              ['image', 'Image'],
              ['audio', 'Audio'],
              ['video', 'Video'],
              ['archive', 'Archive'],
              ['code', 'Code'],
              ['other', 'Other'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              style={filterButtonStyle(category === key)}
              onClick={() => {
                setCategory(key);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <CatalogGrid search={search} category={category} />
    </div>
  );
}

/**
 * Searchable + filterable grid of every file-type glyph the
 * registry ships. Filter chips switch the visible category
 * (Document, Spreadsheet, Presentation, Image, Audio, Video,
 * Archive, Code, Other); search narrows by extension or display
 * name. Each tile shows the canonical
 * `import { … } from '@glaon/ui'` line for copy-paste.
 */
export const Catalog: Story = {
  render: () => <CatalogPage />,
};
