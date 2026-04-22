import { expect, test } from '@playwright/test';

test.describe('web app @smoke', () => {
  test('renders the root heading and tagline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Glaon');
    await expect(page.getByText(/Secure Home Assistant frontend/i)).toBeVisible();
  });

  test('has a restrictive CSP meta tag', async ({ page }) => {
    await page.goto('/');
    const csp = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain('unsafe-eval');
  });
});
