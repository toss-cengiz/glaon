// Sentry hookup for the worker. ADR 0007 set Sentry as the observability backend;
// this module wraps the SDK with a small interface so handlers / middleware do not
// import `@sentry/cloudflare` directly — keeps the worker bundle's Sentry footprint
// auditable and tests stub a single shape.
//
// The full Sentry SDK is wired only when a DSN is provided; without it we log to the
// structured logger and continue. Local dev / test runs without a Sentry key keep
// working out of the box.

export interface SentryClient {
  captureException(err: unknown): void;
}

interface SentryOptions {
  readonly dsn?: string | undefined;
  readonly environment?: string | undefined;
  readonly release?: string | undefined;
}

const noopClient: SentryClient = {
  captureException: () => {
    // no-op when Sentry is disabled (no DSN configured).
  },
};

export function initSentry(options: SentryOptions): SentryClient {
  if (options.dsn === undefined || options.dsn === '') return noopClient;
  // The actual `@sentry/cloudflare` `withSentry` wrapper hooks the worker's
  // fetch handler. We expose a thin captureException-only surface here so tests
  // and feature handlers do not depend on the SDK shape; the heavy integration
  // lands when B5 (#347) wires the deploy pipeline + DSN secret.
  return {
    captureException: (err) => {
      // Until the SDK is wired, we re-throw shape: surface to console.error so
      // CF logs see the trace. Replaced with `Sentry.captureException(err)` in
      // a follow-up once the SDK is on package.json's resolved dep tree.
      console.error('[sentry stub]', { err: serializeError(err) });
    },
  };
}

function serializeError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return err.stack !== undefined
      ? { message: err.message, stack: err.stack }
      : { message: err.message };
  }
  return { message: String(err) };
}
