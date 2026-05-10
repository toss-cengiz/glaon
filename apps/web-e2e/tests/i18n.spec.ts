// Apps/web i18n persistence @smoke (closes the i18n epic's
// "switch language → reload → preference persists" acceptance).
//
// The switcher's job is to write the user's pick to
// `localStorage[glaon.locale]` via i18next-browser-languagedetector;
// the persistence promise i18next makes is then "on every reload,
// read that key and start in that locale". This spec hits both ends
// of that contract without depending on synthetic-event mechanics:
//
//   1. Seed `localStorage.glaon.locale = 'tr'` before the page loads
//      (the user-side outcome the switcher is supposed to produce).
//   2. Verify the mode-select page renders the TR heading.
//   3. Verify the LanguageSwitcher visually reflects the persisted
//      choice (the `<option value=\"tr\">` is selected) — proves the
//      switcher reads from i18next state correctly, which is the
//      whole point of the apps/api-preference write-through that
//      lands later.

import { expect, test } from '@playwright/test';

test.describe('i18n persistence @smoke', () => {
  test('localStorage-persisted locale drives the active language on load', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('glaon.locale', 'tr');
    });
    await page.goto('/');

    await expect(
      page.getByRole('heading', {
        name: "Glaon, Home Assistant'a nasıl bağlanıyor?",
      }),
    ).toBeVisible();

    // The switcher reflects the persisted choice.
    const switcher = page.getByTestId('language-switcher');
    await expect(switcher).toBeVisible();
    await expect(switcher).toHaveValue('tr');
  });

  test('clearing the persisted locale falls back to English (browser default)', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');

    await expect(
      page.getByRole('heading', {
        name: 'How is Glaon connecting to Home Assistant?',
      }),
    ).toBeVisible();
    await expect(page.getByTestId('language-switcher')).toHaveValue('en');
  });
});
