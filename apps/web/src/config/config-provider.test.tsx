import { act, render, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  DEVICE_CONFIG_SCHEMA_VERSION,
  type DeviceConfig,
  InMemoryConfigStore,
} from '@glaon/core/config';

import { ConfigProvider, useDeviceConfig } from './config-provider';

function wrap(store: InMemoryConfigStore, initialConfig?: DeviceConfig | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return initialConfig === undefined ? (
      <ConfigProvider configStore={store}>{children}</ConfigProvider>
    ) : (
      <ConfigProvider configStore={store} initialConfig={initialConfig}>
        {children}
      </ConfigProvider>
    );
  };
}

describe('useDeviceConfig', () => {
  it('throws a clear error when used outside the provider', () => {
    expect(() => renderHook(() => useDeviceConfig())).toThrow(
      /useDeviceConfig must be used inside <ConfigProvider>/,
    );
  });

  it('starts with null config and isConfigured=false when no initialConfig is supplied', () => {
    const store = new InMemoryConfigStore();
    const { result } = renderHook(() => useDeviceConfig(), { wrapper: wrap(store) });
    expect(result.current.config).toBeNull();
    expect(result.current.isConfigured).toBe(false);
  });

  it('hydrates from initialConfig synchronously on first render', () => {
    const store = new InMemoryConfigStore();
    const { result } = renderHook(() => useDeviceConfig(), {
      wrapper: wrap(store, {
        schemaVersion: DEVICE_CONFIG_SCHEMA_VERSION,
        homeName: 'Olivia',
        completedAt: '2026-05-17T00:00:00.000Z',
      }),
    });
    expect(result.current.config?.homeName).toBe('Olivia');
    expect(result.current.isConfigured).toBe(true);
  });

  it('setPartial writes through the store and updates the hook value', async () => {
    const store = new InMemoryConfigStore();
    const { result } = renderHook(() => useDeviceConfig(), { wrapper: wrap(store) });

    await act(async () => {
      await result.current.setPartial({ homeName: 'Olivia' });
    });

    expect(result.current.config?.homeName).toBe('Olivia');
    expect(result.current.isConfigured).toBe(false);
    expect((await store.get())?.homeName).toBe('Olivia');
  });

  it('markComplete flips isConfigured to true and propagates through the hook', async () => {
    const store = new InMemoryConfigStore();
    const { result } = renderHook(() => useDeviceConfig(), { wrapper: wrap(store) });

    await act(async () => {
      await result.current.setPartial({ homeName: 'Olivia' });
      await result.current.markComplete();
    });

    expect(result.current.isConfigured).toBe(true);
    expect(result.current.config?.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(await store.isConfigured()).toBe(true);
  });

  it('clear empties the store and resets the hook to null', async () => {
    const store = new InMemoryConfigStore();
    const { result } = renderHook(() => useDeviceConfig(), { wrapper: wrap(store) });

    await act(async () => {
      await result.current.setPartial({ homeName: 'Olivia' });
      await result.current.markComplete();
      await result.current.clear();
    });

    expect(result.current.config).toBeNull();
    expect(result.current.isConfigured).toBe(false);
    expect(await store.get()).toBeNull();
  });

  it('renders children unchanged when no consumers are present', () => {
    const store = new InMemoryConfigStore();
    const { getByText } = render(
      <ConfigProvider configStore={store}>
        <p>passthrough</p>
      </ConfigProvider>,
    );
    expect(getByText('passthrough')).toBeInTheDocument();
  });
});
