// Separate vitest config for the integration suite — kept distinct so
// the unit suite (`pnpm --filter @glaon/api test`) doesn't even try to
// load Mongo-touching test files. The CI workflow gates this run on
// `GLAON_API_INTEGRATION=1` so the suite skips itself when the env
// var is missing.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 30_000,
  },
});
