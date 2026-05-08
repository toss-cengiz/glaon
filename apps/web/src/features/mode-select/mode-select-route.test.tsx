import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModeSelectRoute } from './mode-select-route';

describe('ModeSelectRoute', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('network'))),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('renders the mode-select landmark with two cards', async () => {
    const onChoose = vi.fn();
    render(<ModeSelectRoute cloudAvailable={true} onChoose={onChoose} />);
    expect(screen.getByTestId('mode-select-route')).toBeInTheDocument();
    expect(screen.getByTestId('mode-card-local')).toBeInTheDocument();
    expect(screen.getByTestId('mode-card-cloud')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('mode-card-local-meta')).toHaveTextContent(/couldn't auto-detect/i);
    });
  });

  it('disables the cloud card and shows a hint when cloud is unavailable', () => {
    render(<ModeSelectRoute cloudAvailable={false} onChoose={vi.fn()} />);
    expect(screen.getByTestId('mode-card-cloud')).toBeDisabled();
    expect(screen.getByTestId('mode-card-cloud-meta')).toHaveTextContent(
      /cloud is not configured/i,
    );
  });

  it('writes the chosen preference and calls onChoose when the local card is clicked', async () => {
    const onChoose = vi.fn();
    render(<ModeSelectRoute cloudAvailable={true} onChoose={onChoose} />);
    fireEvent.click(screen.getByTestId('mode-card-local'));
    await waitFor(() => {
      expect(onChoose).toHaveBeenCalledWith({ mode: 'local' });
    });
    expect(window.localStorage.getItem('glaon.mode-preference')).toContain('"mode":"local"');
  });

  it('persists the manual URL as `lastLocalUrl` on submit', () => {
    const onChoose = vi.fn();
    render(<ModeSelectRoute cloudAvailable={true} onChoose={onChoose} />);
    const input = screen.getByPlaceholderText(/homeassistant.local/i);
    fireEvent.change(input, { target: { value: 'http://192.168.1.50:8123' } });
    fireEvent.click(screen.getByTestId('mode-select-manual-submit'));
    expect(onChoose).toHaveBeenCalledWith({
      mode: 'local',
      lastLocalUrl: 'http://192.168.1.50:8123',
    });
  });

  it('shows "Local instance found" when the probe resolves successfully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 200 }))),
    );
    render(<ModeSelectRoute cloudAvailable={true} onChoose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId('mode-card-local-meta')).toHaveTextContent(/local instance found/i);
    });
  });
});
