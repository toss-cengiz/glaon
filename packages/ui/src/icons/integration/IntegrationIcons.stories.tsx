import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { integrationCatalog } from './index';

// Storybook docs catalog for the integration-icon registry.
// Phase D.3 of #309 — ships 16 glyphs from Figma's Specialized
// icon collections frame. Mirrors the brand-icon catalog page
// layout for visual consistency.
//
// Cross-referenced platforms (Figma, GitHub, Notion) appear in
// the catalog with the same components used in the brand registry
// — single canonical mark per platform regardless of which
// registry the consumer imports from.
const meta: Meta = {
  title: 'Foundations/Integration Icons',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1025-31781',
    },
    // Docs-only sketch — no canvas snapshot diff because the icon
    // set isn't a behavioural primitive. Per-icon per-PR review
    // covers visual correctness.
    docs: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

function CatalogGrid({ search }: { search: string }) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length === 0) return integrationCatalog;
    return integrationCatalog.filter(
      (entry) => entry.id.includes(q) || entry.label.toLowerCase().includes(q),
    );
  }, [search]);

  if (filtered.length === 0) {
    return (
      <p
        style={{
          padding: 32,
          color: 'var(--color-text-tertiary, #555)',
          textAlign: 'center',
        }}
      >
        No integration glyphs match &quot;{search}&quot;.
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
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-primary, #111)',
            }}
          >
            <Icon className="size-10" />
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

// Convert kebab-case ids to PascalCase component names. Special-
// case `n8n` and `chatgpt` whose canonical exports use mixed
// casing (`N8n`, `ChatGPT`) the kebab-case auto-conversion would
// otherwise mangle.
function componentName(id: string): string {
  if (id === 'n8n') return 'N8n';
  if (id === 'chatgpt') return 'ChatGPT';
  if (id === 'openai') return 'OpenAI';
  return id
    .split('-')
    .map((part) => {
      const head = part.charAt(0);
      return head.length > 0 ? head.toUpperCase() + part.slice(1) : '';
    })
    .join('');
}

function CatalogPage() {
  const [search, setSearch] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        type="search"
        placeholder="Search integration glyphs…"
        aria-label="Search integration glyphs"
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
          maxWidth: 320,
        }}
      />
      <CatalogGrid search={search} />
    </div>
  );
}

/**
 * Searchable grid of every integration glyph the registry ships.
 * Type to filter by display name or import id (e.g. "claude",
 * "vercel", "openai"); each tile renders the glyph at 40px and
 * shows the canonical `import { Brand } from '@glaon/ui'` line
 * for copy-paste.
 */
export const Catalog: Story = {
  render: () => <CatalogPage />,
};
