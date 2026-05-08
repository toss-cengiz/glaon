// Pure-props card primitive used by the mode selector route. No data
// fetching here per the component-data-fetching boundary in CLAUDE.md.

import type { ReactNode } from 'react';

interface ModeSelectorCardProps {
  readonly mode: 'local' | 'cloud';
  readonly title: string;
  readonly description: string;
  readonly meta?: string | undefined;
  readonly disabled?: boolean;
  readonly onSelect: () => void;
}

export function ModeSelectorCard({
  mode,
  title,
  description,
  meta,
  disabled = false,
  onSelect,
}: ModeSelectorCardProps): ReactNode {
  return (
    <button
      type="button"
      data-testid={`mode-card-${mode}`}
      disabled={disabled}
      onClick={onSelect}
      style={{
        display: 'block',
        textAlign: 'left',
        padding: '1.25rem',
        border: '1px solid #d0d7de',
        borderRadius: '12px',
        background: disabled ? '#f3f5f8' : 'white',
        color: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        font: 'inherit',
        width: '100%',
      }}
    >
      <strong style={{ display: 'block', fontSize: '1rem' }}>{title}</strong>
      <span style={{ display: 'block', marginTop: '0.25rem', color: '#5b6770' }}>
        {description}
      </span>
      {meta !== undefined && meta.length > 0 ? (
        <span
          data-testid={`mode-card-${mode}-meta`}
          style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem' }}
        >
          {meta}
        </span>
      ) : null}
    </button>
  );
}
