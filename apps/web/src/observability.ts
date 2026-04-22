import * as Sentry from '@sentry/browser';

import type { ObservabilityEvent } from '@glaon/core/observability';
import { buildBeforeSend } from '@glaon/core/observability';

const CONSOLE_TAG = '[glaon/observability]';

export function initObservability(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const mode = import.meta.env.MODE;
  const isProd = import.meta.env.PROD;

  if (!dsn) {
    if (isProd) {
      // Loud but non-fatal at runtime — the build-time check in vite.config.ts
      // is the real gate for production deploys. Logging here covers the case
      // where a production bundle is served through an environment that
      // bypassed the build gate (e.g. a pre-built artifact from a different
      // pipeline).
      console.error(
        `${CONSOLE_TAG} VITE_SENTRY_DSN is missing in a production bundle — errors will not be reported.`,
      );
    } else {
      console.warn(`${CONSOLE_TAG} Sentry disabled (no DSN set, mode=${mode}).`);
    }
    return;
  }

  const scrub = buildBeforeSend();

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? mode,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    tracesSampleRate: isProd ? 0.1 : 1.0,
    sendDefaultPii: false,
    beforeSend: (event) => {
      const scrubbed = scrub(event as unknown as ObservabilityEvent);
      return scrubbed as unknown as Sentry.ErrorEvent;
    },
  });
}
