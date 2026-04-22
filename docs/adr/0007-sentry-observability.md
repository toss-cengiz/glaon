# ADR 0007 — Sentry observability backend olarak

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-20
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [docs/observability.md](../observability.md), ADR 0004

## Bağlam

Glaon üç istemci (web, tablet, mobile) üzerinde koşuyor ve yerel kullanıcı cihazlarında çalışıyor. Gözlemlenebilirlik ihtiyaçları:

- **Runtime hata toplama** — production bundle'da çöken exception'ların aggregation + alerting'i.
- **Session replay / user feedback** — bir kullanıcı "şu ekranda çalışmıyor" dediğinde adım adım reprodüksiyon.
- **Performans sinyalleri** — LCP, INP, ve özel transaction'ların kuyruk dağılımı.
- **Native crash** — mobile tarafında Hermes + native crash'leri birleşik raporlama.
- **Kaynak harita destekli stack trace** — minified JS'in production'da debug'lanabilir olması.
- **PII scrubbing** — Glaon OAuth token'larla iş görüyor; sızmaması kritik.

Değerlendirilen seçenekler:

- **Sentry (SaaS):** Tüm ihtiyaçları tek platformda veriyor. React + React Native SDK olgun. Source map upload + release tracking hazır. Ücretsiz tier (5K event/ay) başlangıç için yeterli. Self-host seçeneği açık.
- **OpenTelemetry + Jaeger/Grafana:** Vendor-neutral, uzun vadede taşınabilirlik iyi. Dezavantaj: istemci-tarafı crash reporting için out-of-the-box çözüm yok; RUM kurmak elle iş. Glaon ekip boyutu için altyapı yönetimi çok fazla.
- **Datadog RUM:** Tam özellik ama fiyatlandırma küçük projelere uygun değil. 14 günlük retention ücretsiz tier.
- **Honeycomb:** Tracing odaklı, client error collection ana use case değil.
- **LogRocket:** Replay + hata toplama güçlü, ama Sentry'ye göre hata aggregation ve release tracking zayıf.
- **Self-hosted GlitchTip:** Sentry ile API uyumlu open-source alternatif. İstemciden bakıldığında SDK ve akış aynı — geçiş kolay. Ama sunucu yönetimi şu an gereksiz yük.

## Karar

**Sentry (SaaS) web ve mobile için observability backend olarak kullanılır.**

- Web SDK: `@sentry/browser` (vite plugin ile source map upload).
- Mobile SDK: `@sentry/react-native` (Expo config plugin ile native modül bind'i).
- PII scrubbing: `@glaon/core/observability/scrubber` — URL query param, header, key substring temelli filtreleme. Her iki platform aynı scrubber'ı `beforeSend`'te kullanıyor.
- Session replay + user feedback: başlangıçta kapalı; gerek ve gizlilik değerlendirmesi yaparak ayrı issue ile açılacak.
- DSN ve secret'lar `.env.example` üzerinden dokümante, gerçek DSN repo-dışı (GitHub Secrets + EAS secrets).
- Production web build gate: `VITE_SENTRY_DSN` eksikse `vite build --mode production` hata fırlatır (ayrı issue ile refine edilebilir, şimdilik zorunlu — [docs/observability.md](../observability.md)).

## Sonuçlar

### Olumlu

- Tek dashboard web + mobile hatalarını birleştiriyor; kullanıcı raporlarıyla eşleştirme hızlı.
- Source map upload sayesinde prod stack trace debug edilebilir.
- Core scrubber tek kaynaktan çalışıyor; yeni hassas alan eklemek her iki platformu etkiliyor.
- SaaS olduğu için altyapı yönetim yükü sıfır.
- Sentry'nin API'si GlitchTip ile uyumlu → gerekirse self-host'a sessizce geçilebilir (vendor lock-in düşük).

### Olumsuz / ödenecek bedel

- Ücretsiz tier event limiti (5K/ay) büyük kullanıcı tabanında aşılır — sampling ve quota yönetimi gerekiyor.
- SaaS privacy politikasına bağımlılık: OAuth token'ları scrubber ile temizleniyor ama IP adresi ve user agent Sentry'ye gidiyor. KVKK/GDPR tarafında dokümantasyon gerekiyor (issue açılacak).
- Source map upload pipeline'ı CI'da kurulum gerektiriyor; CI süresi uzuyor.
- `@sentry/react-native`'un major version upgrade'leri bazen config drift istiyor (plugin API + native entegrasyon).

### Etkileri

- `@glaon/core/observability` paketi platform-agnostic scrubber + politika tutar (ADR 0004'e uyumlu).
- `apps/web/vite.config.ts` production build gate + `@sentry/vite-plugin` ile source map upload.
- `apps/mobile/app.json` Sentry Expo plugin konfigürasyonu.
- E2E workflow'u placeholder DSN (`sentry.invalid`) ile build gate'ini tatmin ediyor.
- Scrubber davranışı 16 birim test ile donmuş durumda — politika değişikliği test değişikliği ile beraber geliyor.

## Tekrar değerlendirme tetikleyicileri

- Sentry fiyatlandırması veya privacy politikası ciddi şekilde değişirse (KVKK uyumsuzluk).
- Event hacmi Sentry quota'sını aşar hale gelirse ve sampling yetersiz kalırsa.
- Self-host gereksinimi (veri egemenliği, offline deployment) zorunlu hale gelirse — GlitchTip'e geçiş ADR yeniden yazılır, istemci kodu büyük ölçüde aynı kalır.

## Referanslar

- [docs/observability.md](../observability.md)
- [Sentry docs](https://docs.sentry.io)
- [GlitchTip (Sentry API uyumlu self-host)](https://glitchtip.com)
- [CLAUDE.md — Security-First Rules](../../CLAUDE.md#security-first-rules)
