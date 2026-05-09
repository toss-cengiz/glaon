import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import type { PluginOption } from 'vite';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  const isBuild = command === 'build';
  const dsn = env.VITE_SENTRY_DSN;
  // `VITE_E2E_AUTH_STUB=true` swaps `@clerk/clerk-react` for a deterministic
  // stub so the Playwright pairing smoke (#359) can drive the wizard
  // without Clerk's real network. The flag is opt-in; production deploys
  // must NOT set it (a console warning fires if the bundle ever loads
  // with the stub in a real production environment).
  const e2eAuthStub = env.VITE_E2E_AUTH_STUB === 'true';
  if (isBuild && isProd && e2eAuthStub) {
    // eslint-disable-next-line no-console -- visible in CI logs
    console.warn(
      '[glaon/web] VITE_E2E_AUTH_STUB is set in a production build. ' +
        'Clerk will be replaced by a deterministic stub. This is only ' +
        'intended for the E2E pipeline.',
    );
  }

  if (isBuild && isProd && !dsn) {
    throw new Error(
      '[glaon/web] VITE_SENTRY_DSN is required for production builds. ' +
        'Set it in the build environment (e.g. repo secret for the deploy workflow) or build with --mode development.',
    );
  }

  const plugins: PluginOption[] = [react()];

  const authToken = env.SENTRY_AUTH_TOKEN;
  const org = env.SENTRY_ORG;
  const project = env.SENTRY_PROJECT;

  if (isBuild && isProd && authToken && org && project) {
    const releaseOpts = env.VITE_SENTRY_RELEASE
      ? { release: { name: env.VITE_SENTRY_RELEASE } }
      : {};
    plugins.push(
      sentryVitePlugin({
        org,
        project,
        authToken,
        ...releaseOpts,
        sourcemaps: { assets: './dist/**' },
        telemetry: false,
      }),
    );
  }

  return {
    plugins,
    ...(e2eAuthStub
      ? {
          resolve: {
            alias: {
              '@clerk/clerk-react': fileURLToPath(
                new URL('./src/__e2e-stubs__/clerk-react.tsx', import.meta.url),
              ),
            },
          },
        }
      : {}),
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      target: 'es2022',
      sourcemap: true,
    },
  };
});
