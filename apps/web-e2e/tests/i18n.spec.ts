// Apps/web language switcher @smoke (closes the i18n epic's
// "switch language → reload → preference persists" acceptance).
// The switcher writes to localStorage via i18next-browser-languagedetector;
// we assert the user-visible TR copy renders after a reload to prove
// the round-trip — no server hit, no flake on apps/api session.

import { expect, test } from '@playwright/test';

test.describe('i18n language switcher @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // Localdetector reads navigator.language as a fallback; clear any
      // prior `glaon.locale` so the test starts deterministic.
      window.localStorage.clear();
    });
  });

  test('switching to Turkish persists across a hard reload', async ({ page }) => {
    await page.goto('/');
    // EN baseline: the mode-select heading reads in English.
    await expect(
      page.getByRole('heading', {
        name: 'How is Glaon connecting to Home Assistant?',
      }),
    ).toBeVisible();

    // Pick TR via the language switcher.
    await page.getByTestId('language-switcher').selectOption('tr');

    // Strings flip without a reload.
    await expect(
      page.getByRole('heading', {
        name: "Glaon, Home Assistant'a nasıl bağlanıyor?",
      }),
    ).toBeVisible();

    // i18next-browser-languagedetector wrote the choice to localStorage.
    const stored = await page.evaluate(() => window.localStorage.getItem('glaon.locale'));
    expect(stored).toBe('tr');

    // Hard reload — the persisted preference still wins.
    await page.reload();
    await expect(
      page.getByRole('heading', {
        name: "Glaon, Home Assistant'a nasıl bağlanıyor?",
      }),
    ).toBeVisible();
  });
});
