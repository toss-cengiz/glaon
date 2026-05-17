import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    window.name = '';
    window.history.replaceState({}, '', '/');
    window.localStorage.clear();
    // Mark the device as already configured so SetupGate (#539) falls
    // through to the existing Router. Each test that wants to exercise
    // the wizard explicitly drops this key.
    window.localStorage.setItem(
      'glaon.device-config',
      JSON.stringify({ schemaVersion: 1, completedAt: '2026-05-17T00:00:00.000Z' }),
    );
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

  it('renders the LoginPage with the Device tab selected when local mode is the stored preference', async () => {
    window.localStorage.setItem('glaon.mode-preference', JSON.stringify({ mode: 'local' }));
    render(<App />);
    // The unified LoginPage replaces the legacy LoginRoute (#470). Local
    // preference now lands on the page with the Device tab pre-selected.
    expect(await screen.findByTestId('login-device-form')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /welcome back/i })).toBeInTheDocument();
  });
});
