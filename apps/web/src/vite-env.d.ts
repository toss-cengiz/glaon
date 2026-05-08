/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HA_BASE_URL?: string;
  readonly VITE_HA_CLIENT_ID?: string;
  readonly VITE_APP_MODE: 'standalone' | 'ingress' | 'kiosk';
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  readonly VITE_SENTRY_RELEASE?: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
