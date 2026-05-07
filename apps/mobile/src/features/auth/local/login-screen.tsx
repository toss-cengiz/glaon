// Local-mode login screen (mobile). Drives the expo-auth-session flow via the helpers
// in apps/mobile/src/auth/local-auth-flow.ts and dispatches AuthMode through AuthProvider.
//
// The Expo dev client must complete pending auth sessions on iOS/Android — done at the
// module top level via WebBrowser.maybeCompleteAuthSession().

import { maybeCompleteAuthSession } from 'expo-web-browser';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../../auth/auth-provider';
import {
  buildAuthRequest,
  buildDiscovery,
  completeAuthFlow,
  type LocalAuthFlowConfig,
} from '../../../auth/local-auth-flow';

maybeCompleteAuthSession();

interface LoginScreenProps {
  readonly config: LocalAuthFlowConfig;
}

export function LoginScreen({ config }: LoginScreenProps): ReactNode {
  const { tokenStore, setLocalAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSignIn = async (): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      const request = buildAuthRequest(config);
      const result = await request.promptAsync(buildDiscovery(config.baseUrl));
      const completion = await completeAuthFlow(config, request, result, tokenStore);
      if (completion.outcome === 'cancel') {
        setIsLoading(false);
        return;
      }
      if (completion.outcome === 'error') {
        setIsLoading(false);
        setError('Sign-in failed. Please try again.');
        return;
      }
      setLocalAuth(completion.tokens);
    } catch (cause) {
      setIsLoading(false);
      setError(cause instanceof Error ? cause.message : 'Sign-in could not be started.');
    }
  };

  return (
    <View style={styles.container} testID="login-screen">
      <Text style={styles.title}>Glaon</Text>
      <Text style={styles.subtitle}>Sign in with your Home Assistant account to continue.</Text>
      <Pressable
        accessibilityRole="button"
        testID="login-start"
        disabled={isLoading}
        onPress={() => {
          void onSignIn();
        }}
        style={({ pressed }) => [
          styles.button,
          isLoading && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>Sign in with Home Assistant</Text>
        )}
      </Pressable>
      {error !== null && (
        <Text accessibilityRole="alert" testID="login-error" style={styles.error}>
          {error}
        </Text>
      )}
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.75,
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 240,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    marginTop: 16,
    color: '#b00020',
    textAlign: 'center',
  },
});
