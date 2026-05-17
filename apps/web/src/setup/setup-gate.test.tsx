import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEVICE_CONFIG_SCHEMA_VERSION, InMemoryConfigStore } from '@glaon/core/config';

import { ConfigProvider } from '../config/config-provider';
import { SetupGate } from './setup-gate';

interface WrapOptions {
  readonly configStore: InMemoryConfigStore;
  readonly initialConfig?: Parameters<typeof ConfigProvider>[0]['initialConfig'];
}

function wrap({ configStore, initialConfig }: WrapOptions, children: ReactNode) {
  return initialConfig === undefined ? (
    <ConfigProvider configStore={configStore}>{children}</ConfigProvider>
  ) : (
    <ConfigProvider configStore={configStore} initialConfig={initialConfig}>
      {children}
    </ConfigProvider>
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('SetupGate', () => {
  it('renders the wizard when no config is hydrated', () => {
    vi.stubEnv('VITE_APP_MODE', 'standalone');
    const { container, queryByText } = render(
      wrap(
        { configStore: new InMemoryConfigStore() },
        <SetupGate>
          <p>downstream router</p>
        </SetupGate>,
      ),
    );
    // "Home Overview" appears in both the rail and the placeholder
    // body, so disambiguate by querying the h1 the wizard renders.
    expect(queryByText('downstream router')).toBeNull();
    expect(container.querySelector('h1')?.textContent).toBe('Home Overview');
  });

  it('renders downstream children when the config is marked complete', () => {
    vi.stubEnv('VITE_APP_MODE', 'standalone');
    const completedConfig = {
      schemaVersion: DEVICE_CONFIG_SCHEMA_VERSION,
      completedAt: '2026-05-17T00:00:00.000Z',
    } as const;
    const { container, queryByText } = render(
      wrap(
        { configStore: new InMemoryConfigStore(), initialConfig: completedConfig },
        <SetupGate>
          <p>downstream router</p>
        </SetupGate>,
      ),
    );
    expect(queryByText('downstream router')).not.toBeNull();
    // The wizard's h1 should not render because the gate fell through.
    expect(container.querySelector('h1')).toBeNull();
  });

  it('skips the wizard under Ingress mode even when not yet configured', () => {
    vi.stubEnv('VITE_APP_MODE', 'ingress');
    const { container, queryByText } = render(
      wrap(
        { configStore: new InMemoryConfigStore() },
        <SetupGate>
          <p>downstream router</p>
        </SetupGate>,
      ),
    );
    expect(queryByText('downstream router')).not.toBeNull();
    expect(container.querySelector('h1')).toBeNull();
  });
});
