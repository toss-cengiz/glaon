import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    window.name = '';
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('renders the local-mode login route when no auth mode is set', async () => {
    render(<App />);
    expect(await screen.findByTestId('login-route')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Glaon' })).toBeInTheDocument();
    expect(screen.getByTestId('login-start')).toBeInTheDocument();
  });
});
