// ConfigProvider — exposes the device-config blob to the React tree, plus
// async mutators that re-read the store after each write. See ADR 0028 and
// #533.
//
// Pattern mirrors AuthProvider: a single source of truth (the store) sits
// outside React; the provider mirrors its current value into state so
// renders are sync. SetupGate (#539) reads `isConfigured` and short-circuits
// before the Router is even mounted.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { ConfigStore, DeviceConfig, DeviceConfigInput } from '@glaon/core/config';

interface ConfigContextValue {
  readonly config: DeviceConfig | null;
  readonly isConfigured: boolean;
  readonly setPartial: (partial: DeviceConfigInput) => Promise<void>;
  readonly markComplete: () => Promise<void>;
  readonly clear: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

interface ConfigProviderProps {
  readonly configStore: ConfigStore;
  /**
   * Synchronous initial value. App.tsx supplies `WebConfigStore.peekSync()`
   * so SetupGate decides between wizard and Router on the first render
   * without a hydration flash. Tests pass `null` (or a fixture blob) and
   * let the store hydrate via mutator calls.
   */
  readonly initialConfig?: DeviceConfig | null;
  readonly children: ReactNode;
}

export function ConfigProvider({
  configStore,
  initialConfig = null,
  children,
}: ConfigProviderProps): ReactNode {
  const [config, setConfig] = useState<DeviceConfig | null>(initialConfig);

  const value = useMemo<ConfigContextValue>(
    () => ({
      config,
      isConfigured: Boolean(config?.completedAt),
      setPartial: async (partial) => {
        await configStore.setPartial(partial);
        setConfig(await configStore.get());
      },
      markComplete: async () => {
        await configStore.markComplete();
        setConfig(await configStore.get());
      },
      clear: async () => {
        await configStore.clear();
        setConfig(null);
      },
    }),
    [config, configStore],
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useDeviceConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (ctx === null) {
    throw new Error('useDeviceConfig must be used inside <ConfigProvider>');
  }
  return ctx;
}
