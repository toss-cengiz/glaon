// Mode-select first-run screen for mobile (#356). Mirrors the web
// `mode-select-route.tsx` flow:
//   - probe the user's HA hostname (per ADR 0024) with a short timeout
//   - show "Local instance found" / fallback copy
//   - persist `{ mode, lastLocalUrl }` in expo-secure-store
//   - manual URL fallback for cases where the OS resolver can't see the
//     `*.local` host (more common on Android)

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { probeLocal, type LocalProbeResult } from './local-probe';
import { ModeSelectorCard } from './mode-selector-card';
import {
  expoModePreferenceStore,
  type ModeChoice,
  type ModePreference,
  type PreferenceStore,
} from './mode-preference';

const DEFAULT_LOCAL_URL = 'http://homeassistant.local:8123';

interface ModeSelectScreenProps {
  readonly cloudAvailable: boolean;
  readonly defaultLocalUrl?: string;
  readonly preferenceStore?: PreferenceStore;
  readonly initialPreference?: ModePreference | null;
  readonly onChoose: (preference: ModePreference) => void;
}

export function ModeSelectScreen({
  cloudAvailable,
  defaultLocalUrl = DEFAULT_LOCAL_URL,
  preferenceStore = expoModePreferenceStore,
  initialPreference = null,
  onChoose,
}: ModeSelectScreenProps): ReactNode {
  const [manualUrl, setManualUrl] = useState<string>('');
  const probeUrl = useMemo(() => {
    if (
      initialPreference?.lastLocalUrl !== undefined &&
      initialPreference.lastLocalUrl.length > 0
    ) {
      return initialPreference.lastLocalUrl;
    }
    return defaultLocalUrl;
  }, [defaultLocalUrl, initialPreference]);
  const [probeState, setProbeState] = useState<{
    status: 'pending' | 'done';
    result: LocalProbeResult | null;
  }>({ status: 'pending', result: null });

  useEffect(() => {
    const ctl: { cancelled: boolean } = { cancelled: false };
    void (async () => {
      const result = await probeLocal(probeUrl);
      if (ctl.cancelled) return;
      setProbeState({ status: 'done', result });
    })();
    return () => {
      ctl.cancelled = true;
    };
  }, [probeUrl]);

  const choose = (mode: ModeChoice, lastLocalUrl?: string): void => {
    const preference: ModePreference =
      lastLocalUrl !== undefined && lastLocalUrl.length > 0 ? { mode, lastLocalUrl } : { mode };
    void preferenceStore.write(preference);
    onChoose(preference);
  };

  const localMeta = describeLocal(probeState);

  return (
    <View testID="mode-select-screen" style={styles.root}>
      <Text style={styles.heading}>How is Glaon connecting to Home Assistant?</Text>
      <Text style={styles.subheading}>
        Pick the option that matches where you are. You can change this later from settings.
      </Text>

      <ModeSelectorCard
        mode="local"
        title="Local — same Wi-Fi as your home"
        description="Sign in directly to Home Assistant. Fastest, no Glaon cloud account."
        meta={localMeta}
        onSelect={() => {
          choose('local', probeState.result?.reachable === true ? probeUrl : undefined);
        }}
      />

      <ModeSelectorCard
        mode="cloud"
        title="Cloud — anywhere on the internet"
        description="Sign in with your Glaon account. Connects through the Glaon relay."
        disabled={!cloudAvailable}
        meta={cloudAvailable ? undefined : 'Cloud is not configured for this build.'}
        onSelect={() => {
          choose('cloud');
        }}
      />

      <View testID="mode-select-manual-url" style={styles.manualSection}>
        <Text style={styles.manualLabel}>Or enter your Home Assistant URL manually</Text>
        <TextInput
          testID="mode-select-manual-input"
          value={manualUrl}
          onChangeText={setManualUrl}
          autoCapitalize="none"
          autoCorrect={false}
          inputMode="url"
          keyboardType="url"
          placeholder="http://homeassistant.local:8123"
          accessibilityLabel="Home Assistant URL"
          style={styles.manualInput}
        />
        <Pressable
          testID="mode-select-manual-submit"
          accessibilityRole="button"
          accessibilityLabel="Use this URL"
          accessibilityState={{ disabled: manualUrl.trim().length === 0 }}
          disabled={manualUrl.trim().length === 0}
          onPress={() => {
            choose('local', manualUrl.trim());
          }}
          style={[
            styles.manualButton,
            manualUrl.trim().length === 0 ? styles.manualButtonDisabled : null,
          ]}
        >
          <Text style={styles.manualButtonText}>Use this URL</Text>
        </Pressable>
      </View>
    </View>
  );
}

function describeLocal(state: {
  status: 'pending' | 'done';
  result: LocalProbeResult | null;
}): string {
  if (state.status === 'pending') return 'Looking for a Home Assistant on your network…';
  if (state.result?.reachable === true) return `Local instance found at ${state.result.url}`;
  return "Couldn't auto-detect Home Assistant; pick this option to enter the URL manually.";
}

const styles = StyleSheet.create({
  root: { padding: 24 },
  heading: { fontSize: 22, fontWeight: '600' },
  subheading: { fontSize: 14, color: '#5b6770', marginTop: 8, marginBottom: 24 },
  manualSection: { marginTop: 24 },
  manualLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  manualInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  manualButton: {
    minHeight: 48,
    marginTop: 12,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualButtonDisabled: { opacity: 0.5 },
  manualButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
