import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CloudPairClient } from './cloud-api';
import { PairWizardRoute } from './pair-wizard-route';

type InitiateReturn = Awaited<ReturnType<CloudPairClient['initiate']>>;

const SIGNED_IN_AUTH = { isSignedIn: true, getToken: () => Promise.resolve('clerk-token') };
const SIGNED_OUT_AUTH = { isSignedIn: false, getToken: () => Promise.resolve(null) };

let mockedAuth: typeof SIGNED_IN_AUTH | typeof SIGNED_OUT_AUTH = SIGNED_IN_AUTH;

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => mockedAuth,
}));

function makeClient(overrides: Partial<CloudPairClient> = {}): CloudPairClient {
  return {
    initiate: vi.fn(() =>
      Promise.resolve({
        ok: true as const,
        data: { code: '123456', expiresAt: Date.now() + 60_000 },
      }),
    ),
    status: vi.fn(() =>
      Promise.resolve({ ok: true as const, data: { status: 'pending' as const } }),
    ),
    ...overrides,
  };
}

describe('PairWizardRoute', () => {
  beforeEach(() => {
    mockedAuth = SIGNED_IN_AUTH;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the sign-in CTA when Clerk reports signed-out', () => {
    mockedAuth = SIGNED_OUT_AUTH;
    render(<PairWizardRoute client={makeClient()} />);
    expect(screen.getByTestId('pair-wizard-await-clerk')).toBeInTheDocument();
    expect(screen.getByTestId('pair-wizard-sign-in-cta')).toHaveAttribute('href', '/sign-in');
  });

  it('renders the code after a successful initiate', async () => {
    const client = makeClient();
    render(<PairWizardRoute client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('pair-wizard-awaiting')).toBeInTheDocument();
    });
    expect(screen.getByTestId('pair-wizard-code-value')).toHaveTextContent('123456');
  });

  it('flips to claimed when status reports a homeId', async () => {
    const client = makeClient({
      status: vi.fn(() =>
        Promise.resolve({
          ok: true as const,
          data: { status: 'claimed' as const, homeId: 'home-7' },
        }),
      ),
    });
    render(<PairWizardRoute client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('pair-wizard-claimed')).toBeInTheDocument();
    });
    expect(screen.getByText(/home-7/)).toBeInTheDocument();
  });

  it('flips to expired when initiate returns an already-expired code', async () => {
    const client = makeClient({
      initiate: vi.fn(() =>
        Promise.resolve({
          ok: true as const,
          data: { code: '999999', expiresAt: Date.now() - 5_000 },
        }),
      ),
    });
    render(<PairWizardRoute client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('pair-wizard-expired')).toBeInTheDocument();
    });
  });

  it('surfaces an unauthorized error from initiate', async () => {
    const unauthorized: InitiateReturn = { ok: false, err: { kind: 'unauthorized' } };
    const client = makeClient({
      initiate: vi.fn(() => Promise.resolve(unauthorized)),
    });
    render(<PairWizardRoute client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('pair-wizard-error')).toHaveTextContent(/session expired/i);
    });
  });

  it('surfaces a rate-limit error with the retry hint', async () => {
    const rateLimited: InitiateReturn = {
      ok: false,
      err: { kind: 'rate-limited', retryAfterMs: 60_000 },
    };
    const client = makeClient({
      initiate: vi.fn(() => Promise.resolve(rateLimited)),
    });
    render(<PairWizardRoute client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('pair-wizard-error')).toHaveTextContent(/60 seconds/i);
    });
  });

  it('"try again" restarts the initiate flow', async () => {
    const networkErr: InitiateReturn = { ok: false, err: { kind: 'network' } };
    const success: InitiateReturn = {
      ok: true,
      data: { code: 'AAAAAA', expiresAt: Date.now() + 60_000 },
    };
    const responses = [networkErr, success];
    const initiate = vi.fn<CloudPairClient['initiate']>(() => {
      const next = responses.shift();
      if (next === undefined) throw new Error('initiate called more than expected');
      return Promise.resolve(next);
    });
    const client = makeClient({ initiate });
    render(<PairWizardRoute client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('pair-wizard-error')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('pair-wizard-restart'));
    await waitFor(() => {
      expect(screen.getByTestId('pair-wizard-awaiting')).toBeInTheDocument();
    });
    expect(initiate).toHaveBeenCalledTimes(2);
  });

  it('calls onCloudReady when the user clicks "switch to cloud mode"', async () => {
    const client = makeClient({
      status: vi.fn(() =>
        Promise.resolve({
          ok: true as const,
          data: { status: 'claimed' as const, homeId: 'home-12' },
        }),
      ),
    });
    const onCloudReady = vi.fn();
    render(<PairWizardRoute client={client} onCloudReady={onCloudReady} />);
    await waitFor(() => {
      expect(screen.getByTestId('pair-wizard-claimed')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('pair-wizard-switch-to-cloud'));
    expect(onCloudReady).toHaveBeenCalledWith('home-12');
  });
});
