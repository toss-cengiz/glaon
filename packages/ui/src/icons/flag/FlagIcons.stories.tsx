import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { countryCatalog } from './countries';
import { Flag } from './Flag';
import type { FlagRegion } from './types';

// Storybook docs catalog for the flag-icon registry. Phase C.2
// (#366) ships the full ~225-entry country list backed by
// `flag-icons` (option B from the architectural decision). The
// story renders a searchable grid + region filter + shape toggle so
// consumers can locate the flag they need and preview every aspect
// ratio (rectangle / square / circle) side by side.
const meta: Meta = {
  title: 'Foundations/Flag Icons',
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

const REGIONS: { value: 'all' | FlagRegion; label: string }[] = [
  { value: 'all', label: 'All regions' },
  { value: 'africa', label: 'Africa' },
  { value: 'americas', label: 'Americas' },
  { value: 'asia', label: 'Asia' },
  { value: 'europe', label: 'Europe' },
  { value: 'oceania', label: 'Oceania' },
  { value: 'antarctic', label: 'Antarctic' },
];

const SHAPES = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'square', label: 'Square' },
  { value: 'circle', label: 'Circle' },
] as const;

function CatalogGrid({
  search,
  region,
  shape,
}: {
  search: string;
  region: 'all' | FlagRegion;
  shape: (typeof SHAPES)[number]['value'];
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return countryCatalog.filter((entry) => {
      if (region !== 'all' && entry.region !== region) return false;
      if (q.length === 0) return true;
      return (
        entry.code.includes(q) ||
        entry.name.toLowerCase().includes(q) ||
        (entry.nativeName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [search, region]);

  if (filtered.length === 0) {
    return (
      <p
        style={{
          padding: 32,
          color: 'var(--color-text-tertiary, #555)',
          textAlign: 'center',
        }}
      >
        No flags match the current filter.
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
      {filtered.map(({ code, name, nativeName }) => (
        <li
          key={code}
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
            }}
          >
            <Flag
              country={code}
              shape={shape}
              aria-label={name}
              className={shape === 'rectangle' ? 'h-8 w-[2.6667rem]' : 'size-10'}
            />
          </div>
          <div
            style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>{nativeName ?? name}</span>
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
              {`<Flag country="${code.toUpperCase()}" />`}
            </code>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CatalogPage() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<'all' | FlagRegion>('all');
  const [shape, setShape] = useState<(typeof SHAPES)[number]['value']>('rectangle');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="search"
          placeholder="Search flags…"
          aria-label="Search flags"
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
          Region
          <select
            value={region}
            onChange={(event) => {
              setRegion(event.currentTarget.value as 'all' | FlagRegion);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--color-border-primary, #d5d7da)',
              fontSize: 14,
            }}
          >
            {REGIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            color: 'var(--color-text-secondary, #333)',
          }}
        >
          Shape
          <select
            value={shape}
            onChange={(event) => {
              setShape(event.currentTarget.value as (typeof SHAPES)[number]['value']);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--color-border-primary, #d5d7da)',
              fontSize: 14,
            }}
          >
            {SHAPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <CatalogGrid search={search} region={region} shape={shape} />
    </div>
  );
}

/**
 * Searchable grid of every flag the registry ships. Type to filter
 * by ISO code, English name, or native name; pick a region or shape
 * (rectangle / square / circle) to refine. Each tile renders the
 * flag at 32px and shows the canonical `<Flag country="XX" />`
 * snippet for copy-paste.
 */
export const Catalog: Story = {
  render: () => <CatalogPage />,
};
