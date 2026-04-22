# Testing — katmanlar

Glaon'da testler dört katmana yayılır:

| Katman               | Araç                                            | Ne soruyu cevaplar                                                               |
| -------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| **Unit**             | Vitest + Testing Library                        | Pure function / component logic doğru mu?                                        |
| **Story tests**      | Vitest browser mode + `@storybook/addon-vitest` | Her story hatasız render oluyor, `play()` geçiyor, a11y yeşil mi?                |
| **Görsel regresyon** | Chromatic (Storybook snapshot)                  | Component pixel-level değişti mi?                                                |
| **Erişilebilirlik**  | Storybook `addon-a11y` + `@axe-core/playwright` | Axe kuralları hem izole component'te hem de render edilmiş sayfada kırılıyor mu? |
| **Davranışsal E2E**  | Playwright                                      | Kullanıcı akışı uçtan uca çalışıyor mu?                                          |

Sayfa aşağıda önce **Unit**, sonra **E2E** için ayrılmıştır.

## Unit tests (Vitest)

Mobile tarafı Jest/Metro ekosisteminden ötürü ayrı bir runner (ayrı issue); bu bölüm web + shared paketler için.

### Kapsanan workspace'ler

| Workspace     | Ortam   | Coverage include (şu an)   | Threshold |
| ------------- | ------- | -------------------------- | --------- |
| `@glaon/core` | `node`  | `src/observability/**`     | 70%       |
| `@glaon/ui`   | `jsdom` | `src/components/Button/**` | 50%       |
| `@glaon/web`  | `jsdom` | `src/App.tsx`              | 40%       |

### Dosya layout'u

Testler **co-located**: component/modülün yanında `*.test.ts(x)`. Ayrı `__tests__/` klasörü açmak zorunda değil — IDE'de navigasyon daha hızlı olsun diye aynı klasörde tutuyoruz.

```
packages/core/src/
  observability/
    scrubber.ts
    scrubber.test.ts   ← yanında
```

Bir feature birden fazla dosyaya yayılıyorsa her dosya kendi testini alır. Test dosyası sadece Vitest API (`describe`, `it`, `expect`) + assertion + (gerekirse) test helper import eder — production kod yolu testten etkilenmez.

### Komutlar

```bash
# Tüm workspace'lerde unit testleri çalıştır
pnpm test

# Coverage raporu ile (her paket kendi coverage/ dizinini oluşturur)
pnpm turbo run test:coverage

# Tek paket
pnpm --filter @glaon/core test
pnpm --filter @glaon/ui test
pnpm --filter @glaon/web test

# Watch mode (TDD döngüsü)
pnpm --filter @glaon/core exec vitest
```

CI bu işleri `unit-tests` job'unda `pnpm turbo run test:coverage` olarak çalıştırır — threshold kırıldığında job fail olur.

### Coverage thresholds ve ratchet

İlk kurulumda kod tabanının büyük kısmı (auth, ha client, Sentry init) testsiz. Target threshold'lara (70/50/40) ulaşmak için iki eksen kullanılıyor:

1. **Threshold sayısı** — hedef: `core 70%`, `ui 50%`, `web 40%`. Bu PR'da konfigürasyondaki rakamlar bunlar.
2. **`coverage.include` kapsamı** — bugün sadece _gerçekten testli_ modülleri içeriyor (tabloya bak). Yeni bir modüle test yazıldığında aynı PR'da `vitest.config.ts`'teki `include` listesine ekleniyor.

Yani threshold yükselmez; **scope genişler**. Neden: düşük bir threshold'la başlayıp yukarı kırmak, "bugün %65 geçiyor, yarın %64'e düştük, ne yapsak?" tartışmasını davet ediyor. Floor sabit (hedef seviyesi), scope ise test yazdıkça büyür. "50% threshold" sözü `include` içinde anlamlı.

Yeni bir modül için test yazarken akış:

1. Test dosyasını yaz (`<module>.test.ts`).
2. `vitest.config.ts`'te `test.coverage.include` listesine ilgili path glob'unu ekle.
3. `pnpm --filter <pkg> test:coverage` ile yerel olarak doğrula.
4. Aynı PR ile gönder — testler, config include'u ve (uygunsa) ilave asset'ler bir arada.

Threshold değerini değiştirmek ayrı bir konu: hedefin kendisi (70/50/40) yukarı çekilmesi planlı bir karar — ADR veya issue ile. Drive-by olarak düşürme yok.

### Stil ve iyi pratikler

- `describe` bloklarını modül başına tut; her `it` tek bir davranışı doğrulasın.
- Assertion'lar kullanıcı perspektifinden: `screen.getByRole('button', { name: 'Save' })` > `container.querySelector('.btn-primary')`.
- `@testing-library/jest-dom/vitest` matchers'ı (`toBeInTheDocument`, `toBeDisabled`, …) `setup.ts` ile global. Ayrıca import etmeye gerek yok.
- Test içinde `any` / `ts-ignore` yok — production kodunda da yasak, test kodunda dahi haklı bir istisnayı yorumla gerekçeleyince kabul edilir (nadiren).
- Randomness, date, network her zaman stub'lanır. Gerçek fetch / WebSocket dışarıda kalır; test ne kontrol ediliyorsa onu kontrol eder.

Unit test **değildir**:

- DOM'da görsel farkı test etmek (Chromatic).
- Üç component arası akışı test etmek (Playwright).
- Bir utility'nin TypeScript tipini test etmek (type-check job zaten yapıyor).

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

## Runtime a11y (axe-core)

Storybook `addon-a11y` component'i izole ederken axe koşar; E2E katmanı ise **render edilmiş sayfanın tamamını** — routing + state + compose edilmiş ağaç dahil — kontrol eder. İki katman birbirinin yerini almaz; Storybook component tasarım hatalarını, E2E ise integration-level regresyonları yakalar.

### Helper

[`apps/web-e2e/tests/support/a11y.ts`](../apps/web-e2e/tests/support/a11y.ts) içinde `assertA11y(page, options?)` tek fonksiyon ihraç eder. Smoke içinde DOM ready olduktan sonra çağrılır:

```ts
import { assertA11y } from './support/a11y';

test('renders dashboard @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await assertA11y(page);
});
```

### Fail eşiği

- **Fatal (test fail):** `serious` + `critical` impact seviyeleri. CI PR'ı kırmız yapar, ayrıntılı violations listesi `a11y-violations` adıyla Playwright raporuna attach edilir.
- **Informational (fail yok):** `moderate` + `minor` impact. Rapora `a11y-informational` attachment olarak düşer — görünür ama merge'ü engellemez. Fikir: bu seviyeleri zamanla azaltmak için bir zemin; erken aşamada gürültü yapmasın.

Eşik istersen çağrı başına override edilebilir:

```ts
await assertA11y(page, { failOn: ['moderate', 'serious', 'critical'] });
```

### Kuralı devre dışı bırakma (nadir)

`disableRules` escape-hatch'i var ama **her kullanım call-site'ta yorumla gerekçelendirilmeli**. Kabul edilen durumlar:

- Known upstream kütüphane bug'ı (issue + versiyon yaz).
- Kasıtlı tasarım kararı (örn. tooltip-on-hover widget'ta `aria-hidden` paternine özel).

Gerekçesiz `disableRules` = review'da kırmızı bayrak.

```ts
await assertA11y(page, {
  // Untitled UI Combobox v3.2: `aria-activedescendant`'ı option'lar render olmadan
  // set ediyor, upstream #1234. Fix edildiğinde kaldır.
  disableRules: ['aria-valid-attr-value'],
});
```

### İyi kullanım

- Her `@smoke` testine en az bir `assertA11y(page)` çağrısı — sayfa son state'e oturduktan sonra.
- Birden fazla screen'li smoke'ta her screen transition'ından sonra ayrı çağrı.
- Ayrı bir "a11y smoke" dosyası **açma**. Bu katman smoke'ların üstüne koşar; ayrı dosya ikinci bir pass olur, değer katmaz.

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
- Vitest docs: <https://vitest.dev>
- Testing Library: <https://testing-library.com/docs/react-testing-library/intro/>
- İlgili issue: #65 (E2E), #87 (unit).
