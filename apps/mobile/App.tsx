import { StatusBar } from 'expo-status-bar';
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthProvider, useAuth } from './src/auth/auth-provider';
import { CloudAuthProvider, getClerkPublishableKey } from './src/auth/cloud/clerk-provider';
import { useCloudSessionSync } from './src/auth/cloud/use-cloud-session';
import type { LocalAuthFlowConfig } from './src/auth/local-auth-flow';
import { createExpoTokenStore } from './src/auth/expo-token-store';
import { LoginScreen } from './src/features/auth/local/login-screen';
import { initObservability } from './src/observability';

initObservability();

const HA_BASE_URL = process.env.EXPO_PUBLIC_HA_BASE_URL ?? 'http://homeassistant.local:8123';
const HA_CLIENT_ID = process.env.EXPO_PUBLIC_HA_CLIENT_ID ?? 'https://glaon.app/';

export default function App(): ReactNode {
  const tokenStore = useMemo(() => createExpoTokenStore(), []);
  const clerkKey = getClerkPublishableKey();

  // CloudAuthProvider only mounts when EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is
  // configured. Local-mode-only builds skip Clerk entirely so the SDK
  // never fails on import-time when given an empty key (mode-detect #356
  // will narrow scope further).
  const inner = (
    <AuthProvider tokenStore={tokenStore}>
      {clerkKey !== null ? <CloudSessionBridge /> : null}
      <Root />
    </AuthProvider>
  );

  if (clerkKey === null) return inner;
  return <CloudAuthProvider publishableKey={clerkKey}>{inner}</CloudAuthProvider>;
}

function CloudSessionBridge(): ReactNode {
  const { tokenStore } = useAuth();
  useCloudSessionSync(tokenStore);
  return null;
}

function Root(): ReactNode {
  const { mode } = useAuth();
  const config = useMemo<LocalAuthFlowConfig>(
    () => ({
      baseUrl: HA_BASE_URL,
      clientId: HA_CLIENT_ID,
      redirectScheme: 'glaon',
    }),
    [],
  );
  if (mode === null) {
    return (
      <>
        <LoginScreen config={config} />
        <StatusBar style="auto" />
      </>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Glaon</Text>
      <Text style={styles.body}>
        Signed in. The Phase 2 dashboard lands once #10–#12 wire the HA WebSocket.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
