// Glaon E2E test fixture — wraps `@playwright/test` with an auto-seed
// that marks the device as already configured before every test runs.
//
// SetupGate (#539) reads `glaon.device-config.completedAt` synchronously
// at boot and short-circuits to the wizard when absent. Every existing
// smoke spec assumes the user lands on mode-select / LoginPage / etc.,
// so the fixture seeds a completedAt blob during `addInitScript`. The
// device-setup-wizard happy-path spec (#549) opts out by clearing the
// key in its own `addInitScript` before `goto`.

import { test as base } from '@playwright/test';

// `use` is Playwright's conventional name for the second fixture
// argument (the yield-to-the-test callback). eslint's react-hooks rule
// reads `use(...)` as a React Hook call and trips on the surrounding
// `page` function name — rename to `runTest` so the rule stays happy.
export const test = base.extend({
  page: async ({ page }, runTest) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'glaon.device-config',
        JSON.stringify({ schemaVersion: 1, completedAt: '2026-05-17T00:00:00.000Z' }),
      );
    });
    await runTest(page);
  },
});

export { expect } from '@playwright/test';
