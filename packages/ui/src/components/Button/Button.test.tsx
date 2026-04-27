// Smoke coverage for the Glaon Button wrap. The kit source under
// `src/components/base/buttons/button.tsx` carries its own deeper
// behavior coverage in the Storybook stories (executed by Vitest browser
// + axe), so this file focuses on the wrap contract: that the Glaon
// barrel re-exports the kit primitive and renders an accessible button.

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './Button';

describe('Button (Glaon wrap)', () => {
  it('re-exports the kit primitive', () => {
    expect(typeof Button).toBe('function');
  });

  it('renders an accessible button with the children as label', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
