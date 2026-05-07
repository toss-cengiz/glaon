import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginRoute } from './login-route';

const HA_CONFIG = {
  baseUrl: 'http://homeassistant.local:8123',
  clientId: 'http://localhost:5173/',
};
const REDIRECT_URI = 'http://localhost:5173/auth/callback';

describe('LoginRoute', () => {
  beforeEach(() => {
    window.name = '';
  });

  it('renders the brand heading + sign-in button', () => {
    const navigate = vi.fn();
    render(<LoginRoute config={HA_CONFIG} redirectUri={REDIRECT_URI} navigate={navigate} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Glaon' })).toBeInTheDocument();
    expect(screen.getByTestId('login-start')).toBeInTheDocument();
  });

  it('navigates to the HA authorize URL on button click', async () => {
    const navigate = vi.fn();
    render(<LoginRoute config={HA_CONFIG} redirectUri={REDIRECT_URI} navigate={navigate} />);

    fireEvent.click(screen.getByTestId('login-start'));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
    });
    const target = navigate.mock.calls[0]?.[0] as string;
    expect(target).toMatch(/^http:\/\/homeassistant\.local:8123\/auth\/authorize\?/);
    expect(target).toContain('response_type=code');
    expect(target).toContain('code_challenge_method=S256');
  });
});
