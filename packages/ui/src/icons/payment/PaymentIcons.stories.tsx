import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { paymentCatalog } from './index';
import type { PaymentIconCatalogEntry } from './types';

// Storybook docs catalog for the payment-icon registry.
// Phase D.2.a of #309 ships the card-network tier (Visa,
// MasterCard, AMEX, Discover, JCB, UnionPay); D.2.b–d follow with
// digital wallets, BNPL, and regional rails. Mirrors the brand
// + integration + emoji catalog page layout for visual consistency.
//
// Cross-link: `<Input variant="payment">` (#313) and
// `<Table.Cell.PaymentIcon>` (#324 Phase A) consume these glyphs
// via the `paymentIconForBrand(brand)` helper.

type CategoryFilter = 'all' | PaymentIconCatalogEntry['category'];

const meta: Meta = {
  title: 'Foundations/Payment Icons',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1025-31781',
    },
    // Docs-only sketch — no canvas snapshot diff because the icon
    // set isn't a behavioural primitive. Per-icon per-PR review
    // covers visual correctness; downstream Input / Table stories
    // capture the integration moment when the helper swaps the
    // placeholder.
    docs: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

function CatalogGrid({ search, category }: { search: string; category: CategoryFilter }) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return paymentCatalog.filter((entry) => {
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
        No payment glyphs match the current filter.
      </p>
    );
  }

  return (
    <ul
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
              width: 64,
              height: 48,
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
  if (id === 'amex') return 'Amex';
  if (id === 'jcb') return 'Jcb';
  if (id === 'unionpay') return 'UnionPay';
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
          placeholder="Search payment glyphs…"
          aria-label="Search payment glyphs"
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
              ['networks', 'Networks'],
              ['wallets', 'Wallets'],
              ['bnpl', 'BNPL'],
              ['regional', 'Regional'],
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
 * Searchable + filterable grid of every payment glyph the registry
 * ships. Filter chips switch the visible tier (Networks, Wallets,
 * BNPL, Regional); search narrows by id or display name. Each tile
 * shows the canonical `import { … } from '@glaon/ui'` line for
 * copy-paste.
 */
export const Catalog: Story = {
  render: () => <CatalogPage />,
};
