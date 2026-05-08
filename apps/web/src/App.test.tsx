import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    window.name = '';
    window.history.replaceState({}, '', '/');
    window.localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('network'))),
    );
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('renders the mode selector on first visit (no preference, no auth)', async () => {
    render(<App />);
    expect(await screen.findByTestId('mode-select-route')).toBeInTheDocument();
    expect(screen.getByTestId('mode-card-local')).toBeInTheDocument();
  });

  it('renders the local login route when local mode is the stored preference', async () => {
    window.localStorage.setItem('glaon.mode-preference', JSON.stringify({ mode: 'local' }));
    render(<App />);
    expect(await screen.findByTestId('login-route')).toBeInTheDocument();
    expect(screen.getByTestId('login-start')).toBeInTheDocument();
  });
});
