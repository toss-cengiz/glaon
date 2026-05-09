// Mobile mirror of the web pair wizard (#354). Drives the device-code
// flow from the signed-in mobile shell. Same six-state machine; no
// background-tick — Phase 2 keeps the wizard screen in the foreground
// (push notification for "home connected" is deferred to the #29 epic).
//
// Clipboard-link to the addon's /pair page is intentionally NOT
// auto-opened — on a typical mobile setup the addon's Ingress page is
// reachable on the LAN tablet/desktop, not the phone running Glaon. We
// show an instruction line + copy-to-clipboard for the code instead.

import { useAuth } from '@clerk/clerk-expo';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { createCloudPairClient, type CloudPairClient, type CloudPairError } from './cloud-api';

const POLL_INTERVAL_MS = 2_000;

type WizardState =
  | { step: 'await-clerk' }
  | { step: 'initiating' }
  | { step: 'awaiting-claim'; code: string; expiresAt: number }
  | { step: 'claimed'; homeId: string }
  | { step: 'expired' }
  | { step: 'error'; error: CloudPairError };

interface PairWizardScreenProps {
  readonly client?: CloudPairClient;
  readonly onCloudReady?: (homeId: string) => void;
  readonly onCancel?: () => void;
}

export function PairWizardScreen({
  client,
  onCloudReady,
  onCancel,
}: PairWizardScreenProps): ReactNode {
  const auth = useAuth() as unknown as {
    isSignedIn?: boolean;
    getToken: () => Promise<string | null>;
  };
  const signedIn = auth.isSignedIn === true;
  const getTokenRef = useRef(auth.getToken);
  useEffect(() => {
    getTokenRef.current = auth.getToken;
  }, [auth.getToken]);
  const cloudClient = useMemo(() => client ?? createCloudPairClient(), [client]);

  const [state, setState] = useState<WizardState>(
    signedIn ? { step: 'initiating' } : { step: 'await-clerk' },
  );

  useEffect(() => {
    if (signedIn && state.step === 'await-clerk') {
      setState({ step: 'initiating' });
    }
  }, [signedIn, state.step]);

  useEffect(() => {
    if (state.step !== 'initiating') return;
    const ctl: { cancelled: boolean } = { cancelled: false };
    void (async () => {
      const token = await getTokenRef.current();
      if (token === null || token.length === 0) {
        if (!ctl.cancelled) setState({ step: 'error', error: { kind: 'unauthorized' } });
        return;
      }
      const result = await cloudClient.initiate(token);
      if (ctl.cancelled) return;
      if (result.ok) {
        setState({
          step: 'awaiting-claim',
          code: result.data.code,
          expiresAt: result.data.expiresAt,
        });
        return;
      }
      setState({ step: 'error', error: result.err });
    })();
    return () => {
      ctl.cancelled = true;
    };
  }, [state.step, cloudClient]);

  useEffect(() => {
    if (state.step !== 'awaiting-claim') return;
    const code = state.code;
    const expiresAt = state.expiresAt;
    const ctl: { cancelled: boolean } = { cancelled: false };
    const tick = async (): Promise<void> => {
      if (ctl.cancelled) return;
      if (Date.now() >= expiresAt) {
        setState({ step: 'expired' });
        return;
      }
      const token = await getTokenRef.current();
      if (token === null || token.length === 0) {
        setState({ step: 'error', error: { kind: 'unauthorized' } });
        return;
      }
      const result = await cloudClient.status(token, code);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (ctl.cancelled) return;
      if (!result.ok) {
        setState({ step: 'error', error: result.err });
        return;
      }
      if (result.data.status === 'claimed' && typeof result.data.homeId === 'string') {
        setState({ step: 'claimed', homeId: result.data.homeId });
        return;
      }
      if (result.data.status === 'expired') {
        setState({ step: 'expired' });
        return;
      }
    };
    void tick();
    const handle = setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);
    return () => {
      ctl.cancelled = true;
      clearInterval(handle);
    };
  }, [state, cloudClient]);

  const restart = useCallback(() => {
    setState({ step: 'initiating' });
  }, []);

  if (!signedIn) {
    return (
      <Container testID="pair-wizard-await-clerk" onCancel={onCancel}>
        <Text style={styles.title}>Link this home to Glaon cloud</Text>
        <Text style={styles.body}>You need to sign in with your Glaon account first.</Text>
      </Container>
    );
  }

  if (state.step === 'initiating') {
    return (
      <Container testID="pair-wizard-initiating" onCancel={onCancel}>
        <Text style={styles.title}>Generating your pairing code…</Text>
      </Container>
    );
  }

  if (state.step === 'awaiting-claim') {
    return (
      <Container testID="pair-wizard-awaiting" onCancel={onCancel}>
        <Text style={styles.title}>Enter this code on your addon</Text>
        <Text style={styles.body}>
          Open the Glaon addon panel in Home Assistant and choose &ldquo;Link to cloud&rdquo;. Type
          the code below within 10 minutes.
        </Text>
        <PairCodeDisplay code={state.code} />
      </Container>
    );
  }

  if (state.step === 'claimed') {
    return (
      <Container testID="pair-wizard-claimed" onCancel={onCancel}>
        <Text style={styles.title}>Linked.</Text>
        <Text style={styles.body}>
          Home {state.homeId} is now reachable through the Glaon cloud relay.
        </Text>
        <Pressable
          testID="pair-wizard-switch-to-cloud"
          accessibilityRole="button"
          onPress={() => onCloudReady?.(state.homeId)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Switch to cloud mode</Text>
        </Pressable>
      </Container>
    );
  }

  if (state.step === 'expired') {
    return (
      <Container testID="pair-wizard-expired" onCancel={onCancel}>
        <Text style={styles.title}>That code expired.</Text>
        <Text style={styles.body}>Pairing codes are valid for 10 minutes.</Text>
        <Pressable
          testID="pair-wizard-restart"
          accessibilityRole="button"
          onPress={restart}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Generate a new code</Text>
        </Pressable>
      </Container>
    );
  }

  if (state.step === 'error') {
    return (
      <Container testID="pair-wizard-error" onCancel={onCancel}>
        <Text style={styles.title} accessibilityLiveRegion="polite">
          {messageFor(state.error)}
        </Text>
        <Pressable
          testID="pair-wizard-restart"
          accessibilityRole="button"
          onPress={restart}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
      </Container>
    );
  }

  // `await-clerk` already rendered above when `signedIn` is false; once
  // signed in we land in `initiating` via the transition effect.
  return null;
}

interface ContainerProps {
  readonly children: ReactNode;
  readonly testID: string;
  readonly onCancel?: () => void;
}

function Container({ children, testID, onCancel }: ContainerProps): ReactNode {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View testID={testID} style={styles.root}>
        {children}
        {onCancel !== undefined ? (
          <Pressable
            testID="pair-wizard-cancel"
            accessibilityRole="button"
            onPress={onCancel}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

interface PairCodeDisplayProps {
  readonly code: string;
}

function PairCodeDisplay({ code }: PairCodeDisplayProps): ReactNode {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    void Clipboard.setStringAsync(code).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  }, [code]);
  return (
    <View testID="pair-wizard-code" style={styles.codeRow}>
      <Text testID="pair-wizard-code-value" style={styles.codeValue}>
        {code}
      </Text>
      <Pressable
        testID="pair-wizard-copy"
        accessibilityRole="button"
        accessibilityLabel="Copy pairing code"
        onPress={onCopy}
        style={styles.copyButton}
      >
        <Text style={styles.copyButtonText}>{copied ? 'Copied' : 'Copy code'}</Text>
      </Pressable>
    </View>
  );
}

function messageFor(err: CloudPairError): string {
  switch (err.kind) {
    case 'unauthorized':
      return 'Your Glaon session expired. Sign in again to continue.';
    case 'rate-limited':
      return err.retryAfterMs !== null
        ? `Too many attempts. Try again in about ${String(Math.ceil(err.retryAfterMs / 1000))} seconds.`
        : 'Too many attempts. Try again in a moment.';
    case 'not-found':
      return 'The pairing code was not found. Try generating a new one.';
    case 'network':
      return 'Could not reach the Glaon cloud. Check your internet connection.';
    case 'unknown':
      return 'Something went wrong on the Glaon cloud side.';
  }
}

const styles = StyleSheet.create({
  root: { padding: 24 },
  title: { fontSize: 22, fontWeight: '600' },
  body: { fontSize: 14, marginTop: 8, color: '#5b6770' },
  codeRow: { marginTop: 24, alignItems: 'center' },
  codeValue: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'Menlo',
    letterSpacing: 8,
    paddingVertical: 16,
  },
  copyButton: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d7de',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonText: { fontSize: 16, fontWeight: '600' },
  primaryButton: {
    minHeight: 48,
    marginTop: 24,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    minHeight: 48,
    marginTop: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { fontSize: 14, color: '#5b6770' },
});
