import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { brandCatalog } from './index';

// Storybook docs catalog for the brand-icon registry. Phase A ships
// the six glyphs `<SocialButton>` consumes today; Phase A.2 adds the
// remaining 28 platforms from Figma's "Social icon" frame
// (https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1025-31781).
//
// The story renders a searchable grid + copy-import-path affordance
// per icon so consumers can locate the glyph they need without
// memorising the registry filenames.
const meta: Meta = {
  title: 'Foundations/Brand Icons',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1025-31781',
    },
    // The catalog page is a docs-only sketch — no canvas snapshot
    // diff because the icon set ships per-PR baselines through
    // SocialButton's own stories.
    docs: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

function CatalogGrid({ search }: { search: string }) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length === 0) return brandCatalog;
    return brandCatalog.filter(
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
        No brand glyphs match &quot;{search}&quot;.
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
              {`import { ${id.charAt(0).toUpperCase() + id.slice(1)} } from '@glaon/ui'`}
            </code>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CatalogPage() {
  const [search, setSearch] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        type="search"
        placeholder="Search brand glyphs…"
        aria-label="Search brand glyphs"
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
 * Searchable grid of every brand glyph the registry ships. Type to
 * filter by display name or import id (e.g. "google", "apple"); each
 * tile renders the glyph at 40px and shows the canonical
 * `import { Brand } from '@glaon/ui'` line for copy-paste.
 */
export const Catalog: Story = {
  render: () => <CatalogPage />,
};
