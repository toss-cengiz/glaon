// Cloud-mode sign-in screen — minimal email/password form using Clerk's
// React Native hooks (`useSignIn`). Clerk's Expo SDK does not ship a
// drop-in <SignIn> component (web does); the platform pattern is to drive
// the flow directly. This screen is the foundation a deeper UX pass can
// expand on (#357 pairing wizard composes it).
//
// Touch targets meet the iOS HIG / Material guideline of ≥44pt by holding
// `minHeight: 48` on the inputs and primary action.

import { useSignIn } from '@clerk/clerk-expo';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface SignInScreenProps {
  readonly onSignedIn?: () => void;
}

export function SignInScreen({ onSignedIn }: SignInScreenProps): ReactNode {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    if (!isLoaded) return;
    setError(null);
    setBusy(true);
    try {
      const attempt = await signIn.create({ identifier: email, password });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        onSignedIn?.();
        return;
      }
      setError(`Sign-in needs another step (${attempt.status ?? 'unknown'}).`);
    } catch (err) {
      setError(extractClerkMessage(err));
    } finally {
      setBusy(false);
    }
  }, [signIn, setActive, isLoaded, email, password, onSignedIn]);

  return (
    <View style={styles.root} testID="cloud-sign-in-screen">
      <Text style={styles.title}>Sign in to Glaon cloud</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        accessibilityLabel="Email"
        testID="cloud-sign-in-email"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        accessibilityLabel="Password"
        testID="cloud-sign-in-password"
      />

      {error !== null ? (
        <Text style={styles.error} accessibilityLiveRegion="polite" testID="cloud-sign-in-error">
          {error}
        </Text>
      ) : null}

      <Pressable
        style={[styles.button, busy ? styles.buttonBusy : null]}
        onPress={() => void submit()}
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        accessibilityState={{ busy, disabled: busy }}
        disabled={busy}
        testID="cloud-sign-in-submit"
      >
        <Text style={styles.buttonLabel}>{busy ? 'Signing in…' : 'Sign in'}</Text>
      </Pressable>
    </View>
  );
}

function extractClerkMessage(err: unknown): string {
  if (err === null || typeof err !== 'object') return 'Sign-in failed. Please try again.';
  const errors = (err as { errors?: unknown }).errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0] as { message?: unknown };
    if (typeof first.message === 'string' && first.message.length > 0) return first.message;
  }
  const message = (err as { message?: unknown }).message;
  if (typeof message === 'string' && message.length > 0) return message;
  return 'Sign-in failed. Please try again.';
}

const styles = StyleSheet.create({
  root: { padding: 24, gap: 8 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  error: { color: '#b3261e', marginTop: 8 },
  button: {
    minHeight: 48,
    marginTop: 16,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBusy: { opacity: 0.7 },
  buttonLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
