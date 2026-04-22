// Platform-agnostic observability types. Keep free of DOM / React Native imports.
// These types are a structural subset of Sentry's Event + EventHint — small enough
// to stay portable across web and React Native, large enough to drive the scrubber.

export interface ObservabilityRequest {
  url?: string;
  query_string?: string;
  headers?: Record<string, unknown>;
  data?: unknown;
  cookies?: string | Record<string, string>;
}

export interface ObservabilityBreadcrumb {
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  type?: string;
  level?: string;
  timestamp?: number;
  [extra: string]: unknown;
}

export interface ObservabilityEvent {
  request?: ObservabilityRequest;
  contexts?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  tags?: Record<string, unknown>;
  breadcrumbs?: ObservabilityBreadcrumb[];
  user?: Record<string, unknown>;
  [extra: string]: unknown;
}

export type BeforeSendFunction<T extends ObservabilityEvent = ObservabilityEvent> = (
  event: T,
) => T | null;

export interface ObservabilityConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
}
