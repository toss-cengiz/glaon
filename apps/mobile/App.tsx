import { StatusBar } from 'expo-status-bar';
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthProvider, useAuth } from './src/auth/auth-provider';
import type { LocalAuthFlowConfig } from './src/auth/local-auth-flow';
import { createExpoTokenStore } from './src/auth/expo-token-store';
import { LoginScreen } from './src/features/auth/local/login-screen';
import { initObservability } from './src/observability';

initObservability();

const HA_BASE_URL = process.env.EXPO_PUBLIC_HA_BASE_URL ?? 'http://homeassistant.local:8123';
const HA_CLIENT_ID = process.env.EXPO_PUBLIC_HA_CLIENT_ID ?? 'https://glaon.app/';

export default function App(): ReactNode {
  const tokenStore = useMemo(() => createExpoTokenStore(), []);
  return (
    <AuthProvider tokenStore={tokenStore}>
      <Root />
    </AuthProvider>
  );
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
