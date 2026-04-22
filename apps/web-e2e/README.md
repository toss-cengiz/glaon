# @glaon/web-e2e

Glaon web uygulamasının Playwright E2E testleri. Ayrıntılı rehber ve "ne zaman hangi test" kılavuzu için [docs/testing.md](../../docs/testing.md).

## Hızlı komutlar

```bash
pnpm e2e                      # tüm projeler (chromium, firefox, webkit, mobile-chrome)
pnpm --filter @glaon/web-e2e e2e -- --project=chromium
pnpm --filter @glaon/web-e2e e2e:ui
pnpm --filter @glaon/web-e2e e2e:report   # son HTML raporunu aç
```

Playwright otomatik olarak `@glaon/web`'i `vite preview` ile ayağa kaldırır (port 4173). Build önceden hazır değilse Turbo `^build` bağımlılığı ile üretir.

## Yeni test nereye?

`tests/` altına `<feature>.spec.ts`. `@smoke` tag'i happy-path için (CI'da her PR'da koşar); `@extended` daha uzun akışlar için (gece / manuel).

Kaynağına ulaşan gerçek HA talepleri yapma — `page.route()` ile mock'la. Detay [docs/testing.md](../../docs/testing.md#ha-mocking).
