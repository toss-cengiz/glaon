import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import type { PluginOption } from 'vite';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  const isBuild = command === 'build';
  const dsn = env.VITE_SENTRY_DSN;

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
