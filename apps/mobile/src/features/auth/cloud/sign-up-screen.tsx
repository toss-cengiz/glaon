// Cloud-mode sign-up screen — wraps Clerk's `useSignUp` flow with email
// verification. Mirrors `sign-in-screen.tsx`'s layout. Like that screen,
// this is the foundation a deeper UX pass (#357 pairing wizard) builds on.

import { useSignUp } from '@clerk/clerk-expo';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface SignUpScreenProps {
  readonly onSignedUp?: () => void;
}

export function SignUpScreen({ onSignedUp }: SignUpScreenProps): ReactNode {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'collect' | 'verify'>('collect');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startVerification = useCallback(async () => {
    if (!isLoaded) return;
    setError(null);
    setBusy(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPhase('verify');
    } catch (err) {
      setError(extractClerkMessage(err));
    } finally {
      setBusy(false);
    }
  }, [signUp, isLoaded, email, password]);

  const completeVerification = useCallback(async () => {
    if (!isLoaded) return;
    setError(null);
    setBusy(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        onSignedUp?.();
        return;
      }
      setError(`Verification needs another step (${attempt.status ?? 'unknown'}).`);
    } catch (err) {
      setError(extractClerkMessage(err));
    } finally {
      setBusy(false);
    }
  }, [signUp, setActive, isLoaded, code, onSignedUp]);

  return (
    <View style={styles.root} testID="cloud-sign-up-screen">
      <Text style={styles.title}>Create your Glaon account</Text>

      {phase === 'collect' ? (
        <>
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
            testID="cloud-sign-up-email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            accessibilityLabel="Password"
            testID="cloud-sign-up-password"
          />

          {error !== null ? (
            <Text
              style={styles.error}
              accessibilityLiveRegion="polite"
              testID="cloud-sign-up-error"
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            style={[styles.button, busy ? styles.buttonBusy : null]}
            onPress={() => void startVerification()}
            accessibilityRole="button"
            accessibilityLabel="Send verification code"
            accessibilityState={{ busy, disabled: busy }}
            disabled={busy}
            testID="cloud-sign-up-submit"
          >
            <Text style={styles.buttonLabel}>{busy ? 'Sending…' : 'Send verification code'}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>Verification code</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            inputMode="numeric"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            accessibilityLabel="Verification code"
            testID="cloud-sign-up-code"
          />

          {error !== null ? (
            <Text
              style={styles.error}
              accessibilityLiveRegion="polite"
              testID="cloud-sign-up-error"
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            style={[styles.button, busy ? styles.buttonBusy : null]}
            onPress={() => void completeVerification()}
            accessibilityRole="button"
            accessibilityLabel="Complete sign-up"
            accessibilityState={{ busy, disabled: busy }}
            disabled={busy}
            testID="cloud-sign-up-verify"
          >
            <Text style={styles.buttonLabel}>{busy ? 'Verifying…' : 'Verify and continue'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function extractClerkMessage(err: unknown): string {
  if (err === null || typeof err !== 'object') return 'Sign-up failed. Please try again.';
  const errors = (err as { errors?: unknown }).errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0] as { message?: unknown };
    if (typeof first.message === 'string' && first.message.length > 0) return first.message;
  }
  const message = (err as { message?: unknown }).message;
  if (typeof message === 'string' && message.length > 0) return message;
  return 'Sign-up failed. Please try again.';
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
