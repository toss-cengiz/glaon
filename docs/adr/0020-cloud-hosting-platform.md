# ADR 0020 — Cloud hosting platform: Cloudflare Workers + Durable Objects

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-07
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue #340 (this ADR), issue #343 (B1 — apps/cloud scaffold), issue #345 (B3 — WS relay endpoint), issue #347 (B5 — CI deploy pipeline), [ADR 0018 — cloud relay topology](0018-cloud-relay-topology.md), [ADR 0019 — Clerk](0019-identity-provider-clerk.md), [ADR 0022 — deployment + secrets (planlı)](https://github.com/toss-cengiz/glaon/issues/342)

## Bağlam

[ADR 0018](0018-cloud-relay-topology.md) cloud relay'in çalışma şeklini kilitledi: per-home outbound WS bağlantısı (addon agent'tan), per-session inbound WS (client'tan), `(homeId, sessionId)` ile multiplex. Bu **uzun-yaşamlı, durumlu, ev başına bir aktör** ihtiyacı doğuruyor — hosting platform seçimi tam olarak buna göre yapılıyor.

Tartışma çerçevesi:

- **Long-lived WS başına maliyet:** 100 home × 7/24 WS = 100 paralel WS bağlantısı. Hosting'in WS connection charge'ı kritik. Standart "request-based" platformlarda WS pahalı veya desteklenmiyor.
- **Per-home stateful aktör:** Cloud her home için ayrı bir routing context tutmalı (`homeId` → agent WS, multiple client WS'ler). Stateless bir model her frame'de Redis lookup gerektirir (ekstra latency + ops yükü).
- **Region + latency:** Global kullanıcı (Türkiye + Avrupa + ABD potansiyeli). Single region başlangıç için OK ama edge-deployable olmak future-proof.
- **Persistent storage:** B2 (#344) home registry için bir DB lazım. Hosting platformuyla aynı sağlayıcıdan veri merkezi bonus (intra-region gecikme + ops birleşmesi).
- **CI deploy:** ADR 0022 (deployment) hosting'in CI integration'ına bağımlı. Wrangler veya `flyctl` veya benzeri.
- **Cost ramp:** v0 lansmanda 10-50 home; v1.5'te 1k home; v3'te 10k+. Maliyet eğrisi tüm bu skala bandında kabul edilebilir olmalı.
- **Self-host opsiyonu:** Ürün kullanıcısı (self-hoster) "kendi cloud'umu kurabilir miyim?" sorusunu sorabilir. Bu Phase 2'de kapsam dışı (kullanıcılar Glaon-managed cloud kullanır), ama hosting kararı self-host'a en azından migration path bırakıyor mu?

Göz önünde bulundurulan alternatifler:

| Platform                                 | Long-lived WS         | Per-home state        | Cost @ 100 homes                | Cost @ 1k homes         | EU region               | Self-host                      | Karar                        |
| ---------------------------------------- | --------------------- | --------------------- | ------------------------------- | ----------------------- | ----------------------- | ------------------------------ | ---------------------------- |
| **Cloudflare Workers + Durable Objects** | ✅ DO native          | ✅ DO instance        | ~$5/ay (free tier sınırlarında) | ~$30-50/ay (DO + KV/D1) | ✅ (auto-edge)          | ⚠ (workerd OSS, runtime farkı) | **Seçilen**                  |
| **Fly Machines**                         | ✅ Process-based      | ✅ Machine-per-home   | ~$15-25/ay (3 region)           | ~$80-150/ay             | ✅                      | ✅ (Docker, kendin host'la)    | Reddedildi (cost + ops yükü) |
| **Render**                               | ✅ Persistent service | ⚠ Redis ile           | ~$25/ay (per-service)           | ~$100-200/ay            | ⚠ (US default, EU paid) | ❌                             | Reddedildi (cost)            |
| **Railway**                              | ✅ Persistent service | ⚠ Redis ile           | ~$20/ay (variable)              | ~$80-150/ay             | ⚠ (US default)          | ❌                             | Reddedildi (region)          |
| **Self-host VPS (Hetzner/DO)**           | ✅ Native             | ⚠ kendi orchestration | ~$10/ay + ops yükü              | ~$50-100/ay + ops yükü  | ✅ (siz seçersiniz)     | ✅                             | Reddedildi (ops)             |

(Cost rakamları araştırma anındaki sticker price'lar — production'da measured maliyet öncelikli.)

Reddedilme gerekçeleri:

- **Fly Machines** çok cazip: full Node.js, conventional ops, Machine API ile per-home VM ergonomik. Ama maliyet eğrisi DO'nın 2-3 katı (Machine başına runtime + storage). Bizim per-home compute'umuz çok hafif (sadece WS routing); full VM overkill. Self-host opsiyonu güçlü; ileride bu bir tetikleyici olarak yeniden değerlendirme şansı.
- **Render / Railway** geleneksel "container as a service" modeli; persistent WebSocket destekliyor ama per-home stateful aktör için kendi Redis veya Postgres infra'mızı kurmamız gerekecek. Cost eğrisi 1k home'da $100+/ay; CF DO ile 3-5x daha pahalı. Region default'ları US ABD (EU hosting Pro tier'da ek ücret). Reddedildi.
- **Self-host VPS** (Hetzner Cloud €5-20/ay) maliyet açısından en ucuz ama: (a) 7/24 uptime SLA bizim üzerimizde, (b) DDoS, network güvenliği, OS patching, log toplama, monitoring bizim üzerimizde, (c) deployment pipeline'ı sıfırdan kurmak (Docker Swarm / k3s / Coolify / Dokku?) — Phase 2 zaman bütçesinde gereksiz yük. Self-hoster kullanıcı için tetikleyici olarak masada (bkz. tetikleyici bölümü).
- **Cloudflare Workers + Durable Objects** Glaon'un ihtiyacına neredeyse purpose-built: DO native WebSocket hibernation (idle WS'ler memory'den boşaltılır, frame geldiğinde wake olur — 100 idle home'da memory pressure yok), per-DO instance ile per-home izolasyon (`homeId` → unique DO), edge deployment auto (CF datacenter'ı hangisi yakınsa orası).

## Karar

**Cloud hosting platform olarak Cloudflare Workers + Durable Objects seçilmiştir.**

Kararın teknik detayları:

### Topology mapping

```
┌─────────────────────────┐
│  CF Worker (apps/cloud) │  ← inbound HTTP/WS (client + agent)
│  - Auth / route          │
│  - JWKS verify (Clerk)   │
└──────────┬──────────────┘
           │ stub fetch (per homeId)
           ▼
┌─────────────────────────────────────────────────┐
│  Durable Object class: HomeSessionDO            │
│  - 1 instance per homeId                        │
│  - Holds: agent WS, client WS list, session map │
│  - WebSocket Hibernation API                    │
└──────────┬──────────────────────────────────────┘
           │
           ├──→ websocketSend(...) to client(s)
           └──→ websocketSend(...) to agent
```

- **Worker** entry point: HTTP + WebSocket upgrade routing. Auth (Clerk JWT verify, agent `relay_secret` verify), then forward to the right DO via `env.HOME_DO.idFromName(homeId).get()`.
- **HomeSessionDO**: tek bir `homeId` için tüm state. Multiple client WS'ler (mobile + tablet + web aynı kullanıcı), bir agent WS, session id'lerle multiplex. WebSocket Hibernation API kullanıyoruz: idle WS'ler memory'den boşaltılır, frame geldiğinde wake olur — DO instance memory baskısı sıfıra yakın.
- **Storage**: DO transactional storage (per-DO key-value) session metadata için (sessionId → clerkUserId mapping, last-seen timestamps). Kalıcı (cross-DO query gerektiren) veri için ayrı DB (aşağıda).

### Persistent storage

- **Choice:** Cloudflare D1 (SQLite-on-edge). Home registry tablosu (`homes`: homeId, ownerClerkUserId, relaySecretHash, createdAt, revokedAt), audit log (`pair_events`), user metadata (`users`: clerkUserId, locale).
- **Neden D1, Postgres (Neon) değil:** D1 CF ekosisteminin içinde — ek vendor yok, secret yönetimi tek yerden, Worker → D1 edge round-trip <10ms. Schema basit (relational ama heavy join yok); D1'in SQLite tabanı yeterli. Migration runner D1 native (`wrangler d1 migrations apply`).
- **Neden MongoDB (epic #392) değil:** ADR 0014 `apps/api`'nin storage'ı olarak MongoDB seçti. `apps/cloud` `apps/api`'den ayrı bir service; storage'ları farklı olabilir (sınır netleşir). MongoDB Atlas EU region var ama CF Workers'tan 50-100ms ek latency; D1 edge daha uygun. Cross-service query (cloud + api) Phase 2 v0'da yok.
- **Neden Postgres (Neon/Supabase) değil:** Neon mükemmel ama CF Worker → Neon edge roundtrip 50-100ms vs D1 <10ms; lansman skala'sında D1 yeterli.

### Region strategy

- **v0:** Auto-edge (CF Workers her datacenter'da; DO'lar `locationHint` ile tek bir region'a sabitlenebilir). DO `locationHint: 'weur'` (Western Europe) — Türkiye + AB kullanıcılarına yakın. Auto-replicate Phase 2 v0'da yok.
- **v1+:** DO'ların location-aware deployment'ı (`locationHint: 'enam'` US Eastern North America Phase 5 multi-region için). Bu ADR superseded edilmez, locationHint config olarak değişir.
- **Failover:** Tek region başlangıç; CF outage senaryosunda cloud-mod down, kullanıcı local-mod'a geçer (UI banner). Multi-region failover Phase 5+.

### Cost projection (sticker — actual measured TBD)

- **10 home, 24/7 active:** Workers free tier (100k req/day) + DO Standard ($5/ay flat for 1M requests) + D1 (free tier 5GB) → **~$5/ay**.
- **100 home:** ~10M req/ay (state_changed event volume conservatively) + DO Standard active hours fee → **~$15-25/ay**.
- **1k home:** ~100M req/ay + DO Standard + D1 storage 1-5 GB → **~$30-80/ay** (heavy estimate).
- **10k home:** Worker free tier sınırı aşılır (Pro $5/ay başlar), DO active hours scaling, D1 query volume → **~$200-500/ay**.

Maliyet eğrisi düşük + agresif şekilde lineer-altı (DO active hour fee'si idle WS'leri saymıyor). Compare: Fly Machines @ 1k home ~$150-250/ay; Render @ 1k home $200+/ay.

### CI deploy story

- **Tooling:** Wrangler (CF resmi CLI). GH Actions workflow (`.github/workflows/cloud-deploy.yml`) Wrangler ile deploy eder.
- **Environments:** `staging` (auto-deploy from `development` branch) + `prod` (auto-deploy from `main` release). Wrangler `env.staging` / `env.production` config sections.
- **Migration:** `wrangler d1 migrations apply <db-name> --env <env>` workflow step'i. Idempotent migration runner (D1 native).
- **Detay:** ADR 0022 (deployment + secrets) implementation'ı; bu ADR yalnız hosting'i kilitliyor.

### Vendor lock-in + escape hatch

- **Worker portability:** CF Worker code'u standard Web API'leri (Fetch, WebSocket, Crypto) kullanıyor — Vercel Edge, Deno Deploy, Bun runtime'a port edilebilir. DO ise CF-spesifik, ama WS Hibernation + per-instance state benzeri primitives diğer platformlarda yok (Fly Machines en yakın).
- **Migration path:** Eğer DO bağımlılığından çıkmak gerekirse, `HomeSessionDO` class'ı bir Fly Machine + Redis pub-sub kombinasyonuna refactor edilir; Worker tarafı çoğunlukla aynı kalır. Ops yükü artar ama kod riski sınırlı (~1-2 hafta migration).
- **D1 → Postgres:** D1 schema'sı standart SQL; `pg_dump`-style export + Postgres restore mümkün. Migration trigger'ı: D1 limit'i (10GB DB / 25M row read per query) aşılır.
- **Self-host opsiyonu:** Workerd (CF'in Worker runtime'ı open-source, OSS) self-host edilebilir. Ama DO native değil — DO yerine bir Redis veya local-state alternative kurulması lazım. Self-host detaylı plan Phase 2'de yok; tetikleyici olarak listede.

## Sonuçlar

### Olumlu

- **WS hibernation maliyet kazancı:** Idle 7/24 home'lar memory baskı yapmıyor; aktif minute / megabyte fee'si DO Standard'ın temel maliyeti. 1k home @ ~$30-80/ay competitive olamaz.
- **Per-home stateful izolasyon:** DO instance per `homeId` → "noisy neighbor" problemi yok; bir ev'in agent'ının buggy davranışı diğer evleri etkilemiyor.
- **Edge deployment by default:** CF datacenter'ı hangisi yakınsa orada — Türkiye / AB / ABD kullanıcısı için latency optimal. Multi-region kurmak için ek work yok.
- **Tek vendor surface:** Worker + DO + D1 + R2 (gelecek için) — secrets, deploy, observability tek yerden. ADR 0022'nin secrets pipeline'ı CF native (Wrangler secret put).
- **Wrangler dev experience:** `wrangler dev --local` Worker'ı lokal'de çalıştırıyor; Miniflare ile DO + D1 simüle edilebilir. CI'da mock cloud'a gerek yok; integration testler ephemeral D1'a karşı koşar.

### Olumsuz / ödenecek bedel

- **DO bağımlılığı vendor-spesifik:** DO'nun "per-instance stateful actor" semantiği başka platformlarda native yok. Migration cost var (yukarıda 1-2 hafta tahmini).
- **Workers runtime kısıtlamaları:** Node.js native modules çoğunlukla çalışmıyor (Worker is a V8 isolate, not Node). `@neon/serverless`, `jose`, `clerk-backend-js` gibi Worker-friendly kütüphaneler kullanılır; bazı npm paketleri (örn. native bcrypt) Worker'da çalışmaz, alternatif aranır. ADR 0021 pairing'in `bcrypt` ihtiyacı Worker-uyumlu lib (`bcryptjs` veya `@noble/hashes/scrypt`) ile karşılanır.
- **D1 immature (vs Postgres):** D1 GA 2024'te oldu; Postgres ekosisteminin (PgBouncer, replicas, advanced JSON ops) genişliği yok. Phase 2 schema basit (`homes` tablosu, audit log) — D1 yeterli; complex query gerekirse trigger.
- **Observability native zayıf:** CF Workers logs Wrangler `tail` ile çekiliyor; Sentry (ADR 0007) entegrasyonu manuel (CF Logpush → Sentry forward, veya client-side error reporting). Yapılabilir ama setup work var.
- **Cold start (DO instantiation):** İlk request'te DO instance spawn olur (~50-100ms). Idle WS Hibernation sonrası wake de cost var. Pratikte HA event volume'u ile bu cost amortize olur ama "first impression" latency'si UI'da önemli olabilir; mitigation: keep-alive ping eklenebilir.

### Etkileri

- **`apps/cloud` scaffold (B1 — #343):** TypeScript Workers project, Wrangler config (`wrangler.toml`), DO class export, D1 binding, KV binding (gerektiğinde).
- **`@glaon/core` exports:** Wire envelope tipleri ([`./protocol`](../../packages/core/src/protocol/relay.ts)) hem Worker'dan hem client'tan import edilir; runtime farklılığı yok (Worker fetch + WebSocket = browser fetch + WebSocket).
- **CSP `connect-src`:** Web app cloud relay endpoint'ine `wss://relay.glaon.app` (production) veya `wss://relay-staging.glaon.app` (staging) bağlanacak. Concrete URL ADR 0022 deployment'ta belirleniyor.
- **Cost monitoring:** CF dashboard + billing API; alert threshold'ları ($100/ay aşıldığında notify) E5+ ops hardening turunda.
- **Renovate:** Wrangler + `@cloudflare/workers-types` Renovate'in normal akışına dahil; major bump'lar manuel review.

## Tekrar değerlendirme tetikleyicileri

- **DO active hour cost spike:** Aylık DO bill'i $500'ü aşarsa veya per-home cost $0.50/ay'ı geçerse, Fly Machines + Redis konfigürasyonuna migration ROI hesabı yapılır.
- **D1 query limit aşımı:** Migrate to Neon (Postgres serverless edge-friendly) — schema migration script + read-replica setup.
- **CF outage frequency:** Aylık ≥4 saat outage 3 ay üst üste — multi-cloud failover (Fly secondary) değerlendirilir.
- **Self-host community demand:** Self-hosted Glaon cloud isteyen kullanıcı yüzdesi anlamlı olursa (>%5) — workerd-based veya tamamen Node-based alternative cloud build yapılır (ayrı bir Phase 5+ epic).
- **Multi-region zorunluluk:** ABD West Coast veya Asya kullanıcı yoğunluğu Türkiye+AB segmentini geçerse — `locationHint`'leri çoğullaştırma + DO replication strategy (CF resmi multi-region DO 2025'te beta).
- **Workers runtime breaking change:** CF Workers V8 isolate semantiğini değiştirirse (örn. native module support) — hosting değil, kod organizasyonu etkilenir; ADR güncel kalır.

## Referanslar

- Issue [#340 — cloud hosting platform](https://github.com/toss-cengiz/glaon/issues/340) — bu ADR'in tracking issue'su.
- Issue [#343 — B1 apps/cloud scaffold](https://github.com/toss-cengiz/glaon/issues/343) — scaffold implementation.
- Issue [#345 — B3 WS relay endpoint](https://github.com/toss-cengiz/glaon/issues/345) — DO-based relay implementation.
- Issue [#347 — B5 CI deploy pipeline](https://github.com/toss-cengiz/glaon/issues/347) — Wrangler-based deploy.
- [ADR 0018 — cloud relay topology](0018-cloud-relay-topology.md) — DO Hibernation mapping.
- [ADR 0019 — Clerk](0019-identity-provider-clerk.md) — JWT verify Worker'da `jose` ile.
- [ADR 0022 — deployment + secrets (planlı)](https://github.com/toss-cengiz/glaon/issues/342) — Wrangler workflow detayları.
- [ADR 0014 — apps/api over Next.js](0014-apps-api-over-nextjs.md) — apps/api'nin storage'ı (MongoDB) cloud'dan ayrı; sınır net.
- Cloudflare Workers: <https://developers.cloudflare.com/workers/>
- Durable Objects WebSocket Hibernation: <https://developers.cloudflare.com/durable-objects/api/websockets/>
- Cloudflare D1: <https://developers.cloudflare.com/d1/>
- Workerd (Worker runtime, OSS): <https://github.com/cloudflare/workerd>
