// SetupGate — top-level routing gate that decides whether to render the
// first-run wizard or fall through to the existing Router. See ADR 0028
// and epic #533.
//
// Reads `useDeviceConfig().isConfigured` synchronously (the
// ConfigProvider hydrates from `WebConfigStore.peekSync()` on mount, so
// the gate decides on the first render — no wizard-vs-login flash).
//
// Skips the wizard entirely when `import.meta.env.VITE_APP_MODE ===
// 'ingress'`: the add-on already assumes HA is provisioned and most
// wizard fields would be redundant. An Ingress-tuned variant is tracked
// as a follow-up.

import type { ReactNode } from 'react';

import { useDeviceConfig } from '../config/config-provider';
import { SetupRoute } from '../features/setup/setup-route';

interface SetupGateProps {
  readonly children: ReactNode;
}

export function SetupGate({ children }: SetupGateProps) {
  const { isConfigured } = useDeviceConfig();
  if (import.meta.env.VITE_APP_MODE === 'ingress') {
    return <>{children}</>;
  }
  if (!isConfigured) {
    return <SetupRoute />;
  }
  return <>{children}</>;
}
