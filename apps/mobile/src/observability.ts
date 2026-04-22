import * as Sentry from '@sentry/react-native';

import type { ObservabilityEvent } from '@glaon/core/observability';
import { buildBeforeSend } from '@glaon/core/observability';

const CONSOLE_TAG = '[glaon/observability]';

export function initObservability(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const environment =
    process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? (__DEV__ ? 'development' : 'production');
  const release = process.env.EXPO_PUBLIC_SENTRY_RELEASE;

  if (!dsn) {
    if (__DEV__) {
      console.warn(`${CONSOLE_TAG} Sentry disabled (no DSN set).`);
    } else {
      // Prod bundle without DSN — loud but non-fatal. Real gate belongs in the
      // EAS build pipeline (#36) where the secret is injected.
      console.error(
        `${CONSOLE_TAG} EXPO_PUBLIC_SENTRY_DSN is missing in a production bundle — errors will not be reported.`,
      );
    }
    return;
  }

  const scrub = buildBeforeSend();

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    sendDefaultPii: false,
    beforeSend: (event) => {
      const scrubbed = scrub(event as unknown as ObservabilityEvent);
      return scrubbed as unknown as Sentry.ErrorEvent;
    },
  });
}
