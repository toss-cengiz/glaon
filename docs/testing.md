# Testing — E2E ve katmanlar

Glaon'da testler üç katmana yayılır:

| Katman                         | Araç                           | Ne soruyu cevaplar                      |
| ------------------------------ | ------------------------------ | --------------------------------------- |
| **Görsel regresyon**           | Chromatic (Storybook snapshot) | Component pixel-level değişti mi?       |
| **Erişilebilirlik**            | Storybook `addon-a11y`         | Axe kuralları kırılıyor mu?             |
| **Davranışsal E2E** (bu sayfa) | Playwright                     | Kullanıcı akışı uçtan uca çalışıyor mu? |

Unit testler (Vitest) ileride katılacak; bu sayfa şimdilik sadece **E2E** için.

## Zorunlu kural (CLAUDE.md'ye referans)

Her feature PR'ı en az bir Playwright happy-path smoke'ı ile gelir. "Storybook story yok ise merge yok" kuralının davranışsal karşılığı. Bir feature PR'ının "E2E smoke yok" gerekçesi tek kabul edilebilir durumda geçerli: o PR tek başına test yazılabilir bir iş üretmiyorsa (örn. sadece tooling / dependency bump) — bunu PR body'sinde açıkça belirt.

## Dizin yapısı

```
apps/
  web-e2e/
    tests/
      smoke.spec.ts         ← bootstrap canary'si
      <feature>.spec.ts     ← her feature kendi dosyasını açar
    playwright.config.ts
    package.json
```

Bir test dosyası bir feature'a denk gelir. İki feature ise iki dosya.

## Komutlar

```bash
# Lokalde tüm projeler (chromium + firefox + webkit + mobile-chrome)
pnpm e2e

# Sadece chromium
pnpm --filter @glaon/web-e2e e2e -- --project=chromium

# Sadece @smoke tag'li testler (CI ne koşuyorsa)
pnpm --filter @glaon/web-e2e e2e -- --grep @smoke

# UI modunda — traces + time travel
pnpm --filter @glaon/web-e2e e2e:ui

# Son rapor
pnpm --filter @glaon/web-e2e e2e:report
```

Playwright `vite preview`'i otomatik kaldırır (port 4173). Build önceden yoksa Turbo `^build` ile üretir.

## Smoke nasıl yazılır?

Minimum şablon:

```ts
import { expect, test } from '@playwright/test';

test.describe('room list @smoke', () => {
  test('lists rooms after login', async ({ page }) => {
    // 1) Mock HA backend
    await page.route('**/auth/token**', (route) =>
      route.fulfill({ json: { access_token: 'fake', token_type: 'Bearer' } }),
    );
    await page.route('**/api/states**', (route) => route.fulfill({ json: FIXTURE_STATES }));

    // 2) Kullanıcı akışı
    await page.goto('/');
    await page.getByRole('button', { name: /sign in/i }).click();

    // 3) Gözlem — kullanıcının göreceği sonuç
    await expect(page.getByRole('heading', { name: /living room/i })).toBeVisible();
  });
});
```

### İyi smoke karakteristikleri

- **Tek bir happy path'i** uçtan uca doğrular (login → görünür sonuç).
- Kullanıcının gördüğü şeyi kontrol eder: role, label, görünür metin. İç state'e bakmaz.
- Test veri bağımsız — fixture'ları `tests/fixtures/` altına koy.
- 10 saniyenin altında biter. Uzunsa `@extended` tag'le.

### İyi olmayanlar

- Unit test'in taklidi (utility fonksiyonu test etmek).
- Implementation detayları (internal component state, private function).
- CSS class adlarına lock — `getByRole` / `getByLabel` / `getByText` kullan.
- HA'ya gerçek bağlantı — aşağıya bak.

## HA mocking

Gerçek HA backend'ine E2E'den **asla** bağlanma. İki sebep:

1. Deterministiklik: gerçek HA state zamanla değişir, testler flake olur.
2. Güvenlik: CI'da HA credentials bulunmaz.

Playwright'ın `page.route()` API'si ile WebSocket + HTTP'yi intercept et:

```ts
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/states')) return route.fulfill({ json: FIXTURE_STATES });
    if (url.includes('/config')) return route.fulfill({ json: FIXTURE_CONFIG });
    return route.continue();
  });
});
```

WebSocket mocking için `page.routeWebSocket()` (Playwright 1.48+). Paylaşılan fixture ve mock helper'lar `tests/fixtures/` altına.

## CI entegrasyonu

[`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) her PR'da koşar:

- Node 22, pnpm 9, frozen lockfile.
- Playwright browser binary'leri `~/.cache/ms-playwright` altında cache'lenir; cache miss'te `--with-deps` ile indirilir, hit'te sadece system deps.
- Sadece **chromium** projesi + sadece **@smoke** tag'li testler koşar. Cross-browser + extended nightly workflow'a (ayrı issue) bırakılır.
- Test başarısız olursa `playwright-report/` artifact olarak yüklenir (7 gün tutulur). Trace viewer'la açabilirsin:
  ```bash
  pnpm --filter @glaon/web-e2e exec playwright show-report ./playwright-report
  ```

## Trace viewer

Playwright'ın en değerli özelliği trace. Test başarısız olduğunda:

1. CI → Actions → failed workflow → Artifacts → `playwright-report` indir.
2. `pnpm --filter @glaon/web-e2e exec playwright show-trace trace.zip`.
3. Her adımda DOM + network + console + screenshot time-travel olarak görünür.

Lokalde flake yakalamak için `--trace on` ile koş.

## Sorun giderme

- **`webServer timed out`** → `apps/web` build'i yok. `pnpm --filter @glaon/web build` çalıştır veya Turbo'yu `pnpm e2e` ile çalıştır (otomatik build eder).
- **Chromium sistem deps hatası (ubuntu-24.04)** → Workflow `install-deps` step'i çalışmalı; lokalde `pnpm --filter @glaon/web-e2e exec playwright install --with-deps`.
- **Port 4173 in use** → eski `vite preview` instance'ı çalışıyor olabilir; `lsof -ti:4173 | xargs kill`.
- **Flake** → retry 1 CI'da default; iki test de fail ise gerçek sorun. `await expect(...)` yerine `locator.waitFor()` dene; timing kritikse `page.waitForLoadState('networkidle')`.

## Referanslar

- Playwright docs: <https://playwright.dev>
- Playwright trace viewer: <https://playwright.dev/docs/trace-viewer>
- İlgili issue: #65
