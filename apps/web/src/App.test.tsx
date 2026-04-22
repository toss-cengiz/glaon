import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the product heading and bootstrap description', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Glaon' })).toBeInTheDocument();
    expect(screen.getByText(/bootstrap/i)).toBeInTheDocument();
  });
});
