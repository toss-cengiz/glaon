// LoginPage smoke tests. Exercises both tabs end-to-end via fake
// implementations of the dependencies:
//   - `apiClient.haPasswordGrant` is faked through a mock ApiClient
//     passed via the `useDeviceSignIn`'s `options.apiClient`. The
//     LoginPage doesn't accept that injection itself; the test
//     observes the post-success navigation.
//   - Clerk's `useSignIn` is replaced through the global vi.mock so
//     the Cloud tab reads a deterministic `signIn.create`.

import { ToastProvider } from '@glaon/ui';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { AuthProvider } from '../../../auth/auth-provider';
import { WebTokenStore } from '../../../auth/web-token-store';
import { LoginPage } from './login-page';

const HA_DEFAULT_URL = 'http://homeassistant.local:8123';

// Mirrors the apps/web App.tsx provider chain. LoginPage's tabs call
// `useToast()` for API-error reporting (#516), so the ToastProvider
// must be in the tree for tests to render without throwing.
function withProviders(ui: ReactNode, tokenStore: WebTokenStore): ReactNode {
  return (
    <AuthProvider tokenStore={tokenStore}>
      <ToastProvider>{ui}</ToastProvider>
    </AuthProvider>
  );
}

function renderPage(props: { cloudAvailable?: boolean; navigate?: (url: string) => void } = {}) {
  const tokenStore = new WebTokenStore({ logoutEndpoint: '/auth/logout' });
  const navigate = props.navigate ?? vi.fn();
  const ui = withProviders(
    <LoginPage
      defaultHaBaseUrl={HA_DEFAULT_URL}
      cloudAvailable={props.cloudAvailable ?? true}
      imageSlot={null}
      navigate={navigate}
    />,
    tokenStore,
  );
  return { tokenStore, navigate, ...render(ui) };
}

const haPasswordGrantSpy = vi.fn();

vi.mock('../../../api/api-client', () => ({
  createApiClient: () => ({
    haPasswordGrant: haPasswordGrantSpy,
  }),
}));

vi.mock('@clerk/clerk-react', () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: {
      create: vi.fn(() =>
        Promise.resolve({
          status: 'complete',
          createdSessionId: 'sess_test',
        }),
      ),
      authenticateWithRedirect: vi.fn(() => Promise.resolve(undefined)),
    },
    setActive: vi.fn(() => Promise.resolve(undefined)),
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    haPasswordGrantSpy.mockReset();
  });

  it('renders Welcome back heading + Device tab default', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByTestId('login-device-form')).toBeInTheDocument();
  });

  it('renders Figma reference surface — tabs, checkbox, and hero (#501)', () => {
    const tokenStore = new WebTokenStore({ logoutEndpoint: '/auth/logout' });
    render(
      withProviders(
        <LoginPage
          defaultHaBaseUrl={HA_DEFAULT_URL}
          cloudAvailable
          imageSlot={<div data-testid="hero-slot" />}
        />,
        tokenStore,
      ),
    );
    // Tabs render with button-brand pill triggers (role=tab).
    expect(screen.getByRole('tab', { name: /device/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /cloud/i })).toBeInTheDocument();
    // "Remember for 30 days" is present on the active (Device) tab.
    expect(screen.getByRole('checkbox', { name: /remember for 30 days/i })).toBeInTheDocument();
    // imageSlot reaches the DOM via AuthLayout (split variant).
    expect(screen.getByTestId('hero-slot')).toBeInTheDocument();
  });

  it('renders the Cloud tab when ?tab=cloud equivalent is passed via prop', () => {
    const tokenStore = new WebTokenStore({ logoutEndpoint: '/auth/logout' });
    render(
      withProviders(
        <LoginPage
          defaultTab="cloud"
          defaultHaBaseUrl={HA_DEFAULT_URL}
          cloudAvailable
          imageSlot={null}
        />,
        tokenStore,
      ),
    );
    expect(screen.getByTestId('login-cloud-form')).toBeInTheDocument();
  });

  it('shows the inline cloud-unavailable message when cloud is not configured', () => {
    renderPage({ cloudAvailable: false });
    fireEvent.click(screen.getByRole('tab', { name: /cloud/i }));
    expect(screen.getByTestId('cloud-unavailable-inline')).toBeInTheDocument();
  });

  it('submits the device form, navigates on success', async () => {
    haPasswordGrantSpy.mockResolvedValueOnce({
      haAccess: {
        accessToken: 'A',
        refreshToken: 'R',
        expiresIn: 60,
        tokenType: 'Bearer',
      },
      sessionJwt: 'S',
      expiresAt: Date.now() + 60_000,
    });
    const navigate = vi.fn();
    renderPage({ navigate });
    // Both Tabs panels mount their forms; scope to the device form so
    // queries don't trip over the Cloud tab's password input.
    const deviceFormEl = screen.getByTestId('login-device-form');
    const deviceForm = within(deviceFormEl);
    fireEvent.change(deviceForm.getByLabelText(/username/i), { target: { value: 'olivia' } });
    // The kit's password input is wrapped in React-Aria machinery so
    // `getByLabelText('Password')` doesn't resolve cleanly; the
    // visibility-toggle button also matches `/password/i`. Pick the
    // `<input type="password">` directly via DOM query.
    const passwordInput = deviceFormEl.querySelector<HTMLInputElement>('input[type="password"]');
    expect(passwordInput).not.toBeNull();
    if (passwordInput !== null) {
      fireEvent.change(passwordInput, { target: { value: 'correct-horse' } });
    }
    fireEvent.click(deviceForm.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(haPasswordGrantSpy).toHaveBeenCalledTimes(1);
    });
    const arg = haPasswordGrantSpy.mock.calls[0]?.[0] as { username: string; password: string };
    expect(arg.username).toBe('olivia');
    expect(arg.password).toBe('correct-horse');

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/');
    });
  });
});
