# ADR 0026 — apps/api delivery: Glaon-managed hosted service

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-10
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [ADR 0014](0014-apps-api-over-nextjs.md), [ADR 0017](0017-dual-mode-auth.md), [ADR 0020](0020-cloud-hosting-platform.md), [ADR 0025](0025-apps-api-stack.md), [issue #421](https://github.com/toss-cengiz/glaon/issues/421), [issue #392](https://github.com/toss-cengiz/glaon/issues/392)

## Bağlam

[ADR 0014](0014-apps-api-over-nextjs.md) `apps/api`'ı ayrı bir backend service olarak konumlandırdı. [ADR 0025](0025-apps-api-stack.md) stack'i kilitledi (Hono + native MongoDB + Zod). Geriye **nerede çalışacak** sorusu kaldı:

| Model                                      | Veri konumu           | Operasyonel sorumluluk  | Multi-device sync |
| ------------------------------------------ | --------------------- | ----------------------- | ----------------- |
| **Sidecar** — HA Add-on container'ı içinde | Kullanıcının donanımı | Kullanıcı (kendi)       | Tek cihaz / LAN   |
| **Hosted** — Glaon-managed cloud           | Glaon servers         | Glaon ekibi             | Yerleşik          |
| **Hybrid** — config switch ile her iki yol | İkisi de              | Hem kullanıcı hem Glaon | Hosted yolu açık  |

`apps/api` Phase 2 kapsamında saklayacağı veri:

- Saved dashboard layouts (#420) — UI tercihleri.
- (İlerideki) saved scenes, theme overrides, user prefs.

Bu veriler kullanıcının cihazları arasında senkron olmalı (cloud-mode UX'inin satış noktası). HA'nın kendisi bu veriyi storage API üzerinde tutabilir, ama:

1. HA storage API client-side senkron değil (her cihazın kendi indirip aktarması gerekir).
2. Cloud-mode kullanıcısı bağlandığı cihazdan başka bir cihaza geçince HA storage'a doğrudan erişim yok (cloud relay üzerinden indirmek karmaşık).
3. Layout schema'larının HA-language değil, Glaon-language olması bekleniyor.

## Karar

**`apps/api` Glaon-managed hosted service olarak çalışır.** Mongo Atlas (cloud-managed) `apps/api`'a state sağlar; deploy pipeline ile container image push edilir. Sidecar opsiyonu **şimdilik kapsam dışı** — Phase 5'te self-host ihtiyacı olan kullanıcılar için ayrı ADR ile yeniden açılır.

Operasyonel parametreler:

- **Container runtime**: Docker image, [apps/api/Dockerfile](../../apps/api/Dockerfile) tarafından üretilir. Multi-stage; runtime stage `node:22-alpine` üstünde non-root `node` user ile çalışır. `HEALTHCHECK` `wget /healthz`.
- **Hosting platformu**: Container runtime gerektiriyor (native MongoDB driver Cloudflare Workers'a uymaz, ADR 0020'nin Workers kararı `apps/cloud`'a özgü). Fly.io, Render, Hetzner Cloud, AWS Fargate; final platform pick'i deploy workflow'u (P2-H, #422) ile karara bağlanır. Bu ADR sadece "container-on-VM/PaaS" modelini kilitler.
- **Veritabanı**: Mongo Atlas paid tier (M10 minimum, üç-replika set). Self-host alternatifini reddetmenin sebebi: TLS, replica set, backup, monitoring tooling Atlas'ta yerleşik; Phase 2 ekibinde DBA yok.
- **Secrets**: `MONGODB_URI`, `SESSION_JWT_SECRET`, `SENTRY_DSN` deploy pipeline tarafından platform secret store'una inject edilir. Secret rotation prosedürü `docs/api.md`'de.

Cloud-mode + apps/api topolojisi:

```
apps/web ──┐
           ├── HTTPS ──► apps/api  (saved layouts, prefs)
apps/mobile ┘                │
                             ▼
                        Mongo Atlas

apps/web ──┐
           ├── WSS ──► apps/cloud (relay)
apps/mobile ┘                │
                             ▼
                          HA add-on
```

İki ayrı service. `apps/cloud` short-lived WebSocket session'ları yönetir (HA frame relay); `apps/api` long-lived persistence'ı tutar. Bunları aynı service yapma fikri reddedildi — runtime modelleri farklı (Workers + Durable Objects vs. Node + Mongo) ve sorumluluk ayrımı sağlıklı.

## Sonuçlar

### Olumlu

- **Multi-device sync built-in** — cloud-mode UX'inin headline'ı için zorunlu olan tek model bu.
- **Operasyonel tutarlılık** — Glaon ekibi zaten `apps/cloud`'u operate ediyor; `apps/api` aynı pipeline + monitoring + alerting'i kullanır.
- **Sidecar açık door** — Phase 5'te self-host topluluğu için ayrı ADR ile ele alınır; bu ADR onu kapatmıyor.
- **Production-grade Mongo** — Atlas backup, replica set, TLS, monitoring hazır gelir.

### Olumsuz / ödenecek bedel

- **Hosting maliyeti** — apps/api + Mongo Atlas tier'ı sabit aylık gider. Free-tier kullanıcılar için subsidize edilir; paid tier'lar pricing modelinde explicit (Phase 5 monetization).
- **Veri konumu** — kullanıcının layout tercihleri Glaon servers'ta. ToS + privacy policy bunu açıkça belirtmeli; data export endpoint'i (#? Phase 3) gelecek.
- **Tek nokta arıza** — `apps/cloud` ile aynı kategoride; uptime SLO için status page + alerting (#423 P2-I observability).
- **Sidecar kullanıcısı yok** — gerçekten LAN-only çalıştırmak isteyen güçlük çekecek; LAN-only kullanıcı zaten layout sync'e ihtiyaç duymadığı için lokal `localStorage` fallback'i (apps/web tarafında) Phase 3 cleanup turunda eklenir.

### Etkileri

- **P2-H workflow** (#422): GitHub Actions → container registry push (GHCR) → platform-specific deploy. Platform pick PR #422 içinde detaylanır.
- **secrets**: env-driven (`MONGODB_URI`, `SESSION_JWT_SECRET`, `SENTRY_DSN`, `WEB_ORIGINS`). Üretim deploy pipeline'ı bunları repo secret'larından inject eder; lokal dev `apps/api/.env`'den yiyor (`apps/api/docker-compose.yml` Mongo'yu sibling container olarak çalıştırıyor).
- **`addon/config.yaml`** değişmiyor — addon hâlâ sadece web bundle + relay agent içeriyor (`apps/api` addon içinde değil).
- **Privacy policy / ToS** Phase 5 monetization işiyle birlikte güncellenir.

## Tekrar değerlendirme tetikleyicileri

- **Topluluk talebi self-host'a yoğun yönelirse** — Phase 5'te sidecar ADR'i (Mongo'yu hafif bir alternatif olan SQLite'a indirme dahil) yeniden açılır.
- **Mongo Atlas pricing değişirse** — self-managed Mongo (DigitalOcean managed DB, Hetzner) alternatifi değerlendirilir; ADR 0026 update'i gerekmez (operasyonel detay).
- **Workers Containers veya Bun/Deno-on-edge production-ready hale gelirse** — `apps/api` runtime'ı Edge'e taşıma fizibilitesi yeniden bakılır; mevcut Hono codebase taşınabilir (ADR 0025 buna açık).

## Referanslar

- [Mongo Atlas pricing](https://www.mongodb.com/pricing)
- [apps/api Dockerfile](../../apps/api/Dockerfile)
- [apps/api/docker-compose.yml](../../apps/api/docker-compose.yml) — local dev
- [docs/api.md](../api.md) — bootstrap, deploy, secrets, troubleshoot
- [ADR 0020](0020-cloud-hosting-platform.md) — `apps/cloud` Workers kararı
- [ADR 0022](0022-cloud-deployment-secrets.md) — `apps/cloud` deploy + secrets
