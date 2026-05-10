import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthProvider, useAuth } from './src/auth/auth-provider';
import { CloudAuthProvider, getClerkPublishableKey } from './src/auth/cloud/clerk-provider';
import { useCloudSessionSync } from './src/auth/cloud/use-cloud-session';
import type { LocalAuthFlowConfig } from './src/auth/local-auth-flow';
import { createExpoTokenStore } from './src/auth/expo-token-store';
import { LoginScreen } from './src/features/auth/local/login-screen';
import { SignInScreen } from './src/features/auth/cloud/sign-in-screen';
import { PairWizardScreen } from './src/features/cloud-pairing/pair-wizard-screen';
import { ModeSelectScreen } from './src/features/mode-select/mode-select-screen';
import {
  expoModePreferenceStore,
  type ModePreference,
} from './src/features/mode-select/mode-preference';
import { I18nProvider } from './src/i18n/I18nProvider';
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

  const tree =
    clerkKey === null ? (
      inner
    ) : (
      <CloudAuthProvider publishableKey={clerkKey}>{inner}</CloudAuthProvider>
    );

  return <I18nProvider>{tree}</I18nProvider>;
}

function CloudSessionBridge(): ReactNode {
  const { tokenStore } = useAuth();
  useCloudSessionSync(tokenStore);
  return null;
}

function Root(): ReactNode {
  const { t } = useTranslation();
  const { mode, clearAuth } = useAuth();
  const clerkKey = getClerkPublishableKey();
  const baseConfig = useMemo<LocalAuthFlowConfig>(
    () => ({
      baseUrl: HA_BASE_URL,
      clientId: HA_CLIENT_ID,
      redirectScheme: 'glaon',
    }),
    [],
  );

  // Mode preference is hydrated asynchronously from SecureStore on mount.
  // Until the read resolves we render nothing — the splash flicker is
  // shorter than rendering and snapping to the picker.
  const [hydrated, setHydrated] = useState<{ done: boolean; preference: ModePreference | null }>({
    done: false,
    preference: null,
  });
  useEffect(() => {
    const ctl: { cancelled: boolean } = { cancelled: false };
    void (async () => {
      const preference = await expoModePreferenceStore.read();
      if (ctl.cancelled) return;
      setHydrated({ done: true, preference });
    })();
    return () => {
      ctl.cancelled = true;
    };
  }, []);

  const choosePreference = useCallback((next: ModePreference) => {
    setHydrated({ done: true, preference: next });
  }, []);
  const switchMode = useCallback(async () => {
    await expoModePreferenceStore.clear();
    await clearAuth();
    setHydrated({ done: true, preference: null });
  }, [clearAuth]);

  if (!hydrated.done) {
    return <StatusBar style="auto" />;
  }

  if (mode === null) {
    if (hydrated.preference === null) {
      return (
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <ModeSelectScreen cloudAvailable={clerkKey !== null} onChoose={choosePreference} />
          <StatusBar style="auto" />
        </ScrollView>
      );
    }
    if (hydrated.preference.mode === 'cloud') {
      if (clerkKey === null) {
        return (
          <View style={styles.cloudUnavailable} testID="cloud-unavailable">
            <Text style={styles.title}>{t('cloudUnavailable.signInTitle')}</Text>
            <Text style={styles.body}>{t('cloudUnavailable.body')}</Text>
            <Pressable
              testID="switch-mode"
              onPress={() => void switchMode()}
              style={styles.switchModeButton}
            >
              <Text style={styles.switchModeButtonText}>
                {t('cloudUnavailable.pickDifferentMode')}
              </Text>
            </Pressable>
            <StatusBar style="auto" />
          </View>
        );
      }
      return (
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <SignInScreen />
          <StatusBar style="auto" />
        </ScrollView>
      );
    }
    const localBaseUrl = hydrated.preference.lastLocalUrl ?? baseConfig.baseUrl;
    const config: LocalAuthFlowConfig = { ...baseConfig, baseUrl: localBaseUrl };
    return (
      <>
        <LoginScreen config={config} />
        <StatusBar style="auto" />
      </>
    );
  }

  return <SignedInShell switchMode={switchMode} clerkKey={clerkKey} />;
}

interface SignedInShellProps {
  readonly switchMode: () => Promise<void>;
  readonly clerkKey: string | null;
}

function SignedInShell({ switchMode, clerkKey }: SignedInShellProps): ReactNode {
  const { t } = useTranslation();
  const [view, setView] = useState<'home' | 'pair-wizard'>('home');

  if (view === 'pair-wizard') {
    if (clerkKey === null) {
      return (
        <View style={styles.cloudUnavailable}>
          <Text style={styles.title}>{t('cloudUnavailable.pairingTitle')}</Text>
          <Text style={styles.body}>{t('cloudUnavailable.body')}</Text>
          <Pressable
            testID="pair-wizard-cancel"
            onPress={() => {
              setView('home');
            }}
            style={styles.switchModeButton}
          >
            <Text style={styles.switchModeButtonText}>{t('cloudUnavailable.back')}</Text>
          </Pressable>
          <StatusBar style="auto" />
        </View>
      );
    }
    return (
      <PairWizardScreen
        onCancel={() => {
          setView('home');
        }}
        onCloudReady={() => {
          // Promote to cloud mode and wipe local state on the next reload.
          void (async () => {
            await expoModePreferenceStore.write({ mode: 'cloud' });
            await switchMode();
          })();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('app.name')}</Text>
      <Text style={styles.body}>{t('shell.signedInPlaceholder')}</Text>
      {clerkKey !== null ? (
        <Pressable
          testID="link-to-cloud"
          onPress={() => {
            setView('pair-wizard');
          }}
          style={styles.switchModeButton}
        >
          <Text style={styles.switchModeButtonText}>{t('shell.linkToCloud')}</Text>
        </Pressable>
      ) : null}
      <Pressable
        testID="switch-mode"
        onPress={() => void switchMode()}
        style={styles.switchModeButton}
      >
        <Text style={styles.switchModeButtonText}>{t('shell.switchMode')}</Text>
      </Pressable>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cloudUnavailable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    textAlign: 'center',
  },
  switchModeButton: {
    minHeight: 48,
    marginTop: 24,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d7de',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchModeButtonText: { fontSize: 16, fontWeight: '600' },
});
