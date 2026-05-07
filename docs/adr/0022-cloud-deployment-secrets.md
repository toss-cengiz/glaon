# ADR 0022 — Cloud deployment + secrets pipeline

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-07
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue [#342](https://github.com/toss-cengiz/glaon/issues/342) (this ADR), issue [#347](https://github.com/toss-cengiz/glaon/issues/347) (B5 — CI deploy pipeline), [ADR 0020 — cloud hosting (CF Workers + DO)](0020-cloud-hosting-platform.md), [ADR 0017 — dual-mode auth](0017-dual-mode-auth.md), [ADR 0019 — Clerk](0019-identity-provider-clerk.md), [ADR 0021 — pairing protocol + relay credential lifecycle](0021-pairing-and-relay-credentials.md)

## Bağlam

[ADR 0020](0020-cloud-hosting-platform.md) cloud hosting'i Cloudflare Workers + Durable Objects + D1 olarak kilitledi. Hosting platformu seçimi yapılınca **deploy süreci, environment ayrımı, secrets yönetimi, schema migration koşum şekli, ve rollback hikâyesi** açıkta kaldı — B5 (#347) implementation issue'su bu kararlara dayanıyor. Bu ADR onları kilitliyor.

Tartışma çerçevesi:

- **Environment sayısı + tetikleyici:** Ne kadar ortam (staging / prod / preview-per-PR)? Hangi git event'i hangi env'e push eder?
- **Secrets:** GH Actions secret'ları kaynaktan, Worker'lara nasıl taşınır? Hangi secrets nereye? Rotation operational maliyeti ne?
- **Migration timing:** D1 schema migration'ları deploy öncesi mi, sonrası mı? Backward-compat schema değişiklikleri için pattern?
- **Rollback hızı:** Production incident'inde ne kadar sürede önceki sürüme dönülebilir? Kim tetikler? DB schema mismatch nasıl çözülür?
- **Versioning:** `apps/cloud` mevcut single-version monorepo manifest'inin altına mı (root `package.json` versiyonuyla bağlı), yoksa kendi release-please paketi mi (bağımsız version)?
- **Client URL injection:** Web (Vite) ve mobile (Expo) build'lerine staging vs prod cloud URL'i build-time'da nasıl geçilir?

Göz önünde bulundurulan alternatifler:

- **Seçenek A — Wrangler tek-environment + branch-bazlı override (rejected):** Tek `wrangler.toml`, branch'e göre `--env` flag'i ile deploy. Çabuk ama secrets'lar tek havuzdan; staging'in test secret'ı prod'u sızdırabilir, izolasyon zayıf.
- **Seçenek B — Wrangler `[env.staging]` + `[env.production]` config sections + dedicated GH workflow (selected):** Karar bölümünde detay. CF native, Wrangler resmi pattern'i; secrets per-env Worker'a yüklenir.
- **Seçenek C — Terraform / Pulumi based deploy (rejected):** Infrastructure-as-code güçlü ama Phase 2 v0 için overkill. Wrangler CLI'ı doğrudan zaten declarative; Terraform katmanı şu skala'da gereksiz indirection.
- **Seçenek D — Preview deploy per PR (rejected — v0 dışı):** Her PR için ephemeral CF Worker preview. Cazip developer experience ama:
  - PR başına ek DO + D1 instance maliyeti küçük ama trivial değil (10 PR ≈ ek $5/ay).
  - PR base URL'leri client build'ine inject etmek non-trivial (Vite dev override + mobile bundle).
  - Phase 2 v0'da staging tek paylaşılan ortam yeterli; preview deploy v1 tetikleyici.

Versioning iki seçenek arasında tartışıldı:

- **Single-version monorepo (mevcut, [`release-please-config.json`](../../release-please-config.json) `packages: {".": ...}`) (selected):** Root `package.json` tek versiyon; web + mobile + addon + cloud aynı release'de hareket eder. Glaon **tek ürün** — kullanıcı için "Glaon v0.3.0" anlamlı, "cloud v1.2.0 + web v0.5.0" değil.
- **Per-package release-please (rejected):** `apps/cloud` için ayrı `release-please-config.json` paketi (`apps/cloud`: own version, own changelog). Bağımsız iteration teorik faydası var (cloud daha sık deploy, web daha az), ama: (a) cloud + web aralarında contract bağımlılığı (ADR 0018 wire protocol); birlikte release etmek kontrat ihlallerini yakalar, (b) iki paralel manifest yönetimi commitlint disiplinini parçalar, (c) kullanıcı için tek versiyon hatırlamak daha kolay. Versioning ayrımı **gerçek bir ihtiyaç ortaya çıktığında** (ör. cloud bağımsız major'a gitmek istediğinde) tetikleyici olarak masada.

## Karar

**Cloud deploy pipeline Wrangler'ın çoklu-environment config pattern'i + tek bir GitHub Actions workflow + CF Worker secrets üstüne kuruluyor. `apps/cloud` mevcut single-version monorepo manifest'inin altında kalıyor — root `package.json` versiyonuyla aynı bant.**

### Environments

| Env          | Worker name           | Tetikleyici                                      | URL (örnek)                       | DB binding         |
| ------------ | --------------------- | ------------------------------------------------ | --------------------------------- | ------------------ |
| `staging`    | `glaon-cloud-staging` | `push` to `development` (paths: `apps/cloud/**`) | `https://relay-staging.glaon.app` | D1 `glaon-staging` |
| `production` | `glaon-cloud`         | `push` to `main` (paths: `apps/cloud/**`)        | `https://relay.glaon.app`         | D1 `glaon-prod`    |

- **Local dev** Wrangler'ın `wrangler dev --local` Miniflare runtime'ı ile koşar; D1 lokal SQLite dosyasında. CI veya hosted bir env değil — geliştirici makinasında.
- **Preview-per-PR** Phase 2 v0 dışı (yukarıda Seçenek D).
- **`development → main` release flow**: release-please normal akışta `development → main` PR'ı açar; merge olunca aynı `cloud-deploy.yml` workflow'u **`production`** target'iyle koşar (paths-filter ekstra: `apps/cloud/**` veya release-please commit'i — paths matcher uyarlanır).

### Secrets pipeline

```
┌──────────────────────┐                  ┌────────────────────────┐
│ GH Actions secrets   │   wrangler put   │ CF Worker env secrets  │
│ (CI runtime)         │ ──────────────►  │ (per-env, runtime)     │
│ - CF_API_TOKEN       │                  │ - CLERK_SECRET_KEY     │
│ - CLERK_SECRET_KEY   │                  │ - SENTRY_DSN           │
│ - SENTRY_DSN         │                  │ - PAIR_BCRYPT_SECRET   │
│ - PAIR_BCRYPT_SECRET │                  │   (per-env values)     │
└──────────────────────┘                  └────────────────────────┘
```

- **Source of truth:** GitHub Actions environment secrets (`staging`, `production` GH environments — protection rules aktif). Insanlar yalnız CF dashboard ve GH UI üzerinden ekleyip günceller; Wrangler `secret put` CI tarafında çağrılır.
- **Wrangler secret put** workflow step'inde `staging` veya `production` env'ine yazar:
  ```bash
  echo "$CLERK_SECRET_KEY" | wrangler secret put CLERK_SECRET_KEY --env staging
  ```
- **Public config (non-secret)** `wrangler.toml` `[env.staging.vars]` / `[env.production.vars]` bloklarında: `GLAON_CLOUD_URL`, `LOG_LEVEL`, `SENTRY_RELEASE` (release-please tag'inden CI'da set edilir).
- **Rotation:** Secret rotate için GH UI → Actions secret update → manual workflow_dispatch (`cloud-deploy.yml` `inputs.rotate_secrets: true` flag'i) → Wrangler her secret'i yeniden put. Worker hot-reload secret'ı pickup eder; DO hibernate'i bozmaz.
- **PII scrubbing invariant ([ADR 0018](0018-cloud-relay-topology.md) risk C14):** Secret'lar log'a düşmez. `wrangler secret put` stdin üzerinden okur, command-line argv'da değer geçmez (GH Actions log'larından otomatik mask'lenir).

### Migration runner

D1 native migration tool'u kullanılır.

- **Migration files:** `apps/cloud/migrations/NNNN_<slug>.sql` (sıra-numaralı, sıfır-dolgulu). D1 her uygulanan migration'ı `_cf_KV` table'ında kayıt eder; idempotency native.
- **Workflow step (deploy öncesi):**
  ```yaml
  - name: Apply migrations (staging)
    run: pnpm --filter @glaon/cloud wrangler d1 migrations apply glaon-staging --env staging --remote
  ```
- **Sıralama:** Önce migration apply, sonra Worker deploy. Bu sayede Worker yeni schema bekleyen kod'la başlar; eski Worker eski schema ile devam ederken yeni migration'ın **backward-compat** olması zorunlu.
- **Backward-compat zorunlu**: Schema değişiklikleri eski Worker code'unu kırmamalı. Pattern:
  - **Add column / table:** safe (eski code yeni kolonları görmezden gelir).
  - **Rename column:** iki adımda — (1) yeni kolon ekle + her iki yere yaz, (2) eski kolon'u silmek için ayrı migration + ayrı deploy.
  - **Drop column:** önce yazımları durdur (deploy), sonra drop migration (sonraki deploy).
  - **Type change:** type widening safe (TEXT(50) → TEXT); narrowing eski Worker'ı kırar — iki adım.
- **Down migration yok:** D1 forward-only. Schema-level revert "compensating migration" olarak yazılır (yeni numaralı migration), code revert'ten sonra.

### Rollback strategy

- **Worker rollback (kod):** Wrangler deployment history (CF default 10 son deployment retained, paid plan daha fazla). `wrangler rollback <deployment-id> --env <env>` ile saniyeler içinde önceki revision'a dön.
- **Manuel tetikleyici:** `cloud-deploy.yml` workflow'unda `workflow_dispatch` event'i + `inputs.rollback_to: <deployment-id>` (opsiyonel). Operatör GH Actions UI'dan tetikler. Otomatik rollback (failed deploy → otomatik geri al) Phase 2 v0'da yok — manual gate.
- **DB schema rollback:** Yukarıda not edildi. Forward-only; deploy script'i `wrangler d1 migrations list --env <env>` ile applied migrations'ı log'lar (audit). Eğer rollback'in kod'u eski schema'yı bekliyorsa ve yeni migration applied ise: önce compensating migration deploy edilir, sonra Worker rollback.
- **Audit log:** Her `cloud-deploy.yml` koşması `apps/cloud` deploy event'ini Sentry'ye structured log gönderir (`deployment.id`, `git.sha`, `actor`, `env`). Phase 5 audit dashboard'unda görüntülenir.
- **MTTR hedefi (subjektif):** Worker rollback < 2dk (Wrangler API call). Schema-coupled regression < 30dk (compensating migration + redeploy). Bu hedefler ölçülecek; v1.5'te SLO'ya bağlanır.

### Versioning model

- **`apps/cloud` single-version monorepo manifest'inin altında.** [`release-please-config.json`](../../release-please-config.json) `"packages": { ".": {...} }` aynı kalır. Cloud deploy CI workflow'u `git describe`-tabanlı SHA'yı `SENTRY_RELEASE` env var'a yazar (release tag'i yerine commit hash) — Sentry release tracking için yeterli.
- **`apps/cloud/package.json`** `"private": true`, `"version": "0.0.0"` (placeholder). Root `package.json` versiyonunu okuyan değil — Glaon "tek ürün" felsefesinde version cloud'a değil, root'a aittir; cloud'un kendi version'u CI sırasında commit SHA olarak yazılır.
- **CHANGELOG'da cloud bölümü:** `cloud-deploy.yml`'in ürettiği commit'ler `feat:` / `fix:` Conventional Commit'leri olduğu sürece release-please otomatik dahil eder. Ekstra config gerekmiyor.

### Client cloud URL

Web ve mobile build'leri farklı cloud endpoint'lerine işaret edecek.

- **Web (Vite):** `apps/web/.env.production` → `VITE_GLAON_CLOUD_URL=wss://relay.glaon.app`. CI'da branch bazlı override:
  - `development` build → `VITE_GLAON_CLOUD_URL=wss://relay-staging.glaon.app`
  - `main` (release) build → `VITE_GLAON_CLOUD_URL=wss://relay.glaon.app`
  - Vite `import.meta.env.VITE_GLAON_CLOUD_URL` runtime'da okur.
- **Mobile (Expo):** `apps/mobile/app.config.ts` `extra.glaonCloudUrl`'u `process.env.EXPO_PUBLIC_GLAON_CLOUD_URL` ile dolduruyor. EAS Build profilleri (`development`, `preview`, `production`) farklı env değerleri taşır.
- **Local mode (cloud bypass):** Kullanıcı sadece local-mode kullanıyorsa client cloud URL'ine bağlanmıyor; URL'in opsiyonel olması yeterli (`HaClient` cloud transport'u yalnız mode `cloud` seçildiğinde init eder — ADR 0018 invariant).

### CI tooling pin'leri

- `wrangler@^4` (Wrangler v4 GA, current) — Renovate normal akışına dahil; major bump'lar manuel review.
- `@cloudflare/workers-types` Worker TypeScript types — Renovate normal akış.
- GH Actions: `cloudflare/wrangler-action@<sha>` SHA-pinned (ADR 0008 + governance pattern).
- Workflow path: `.github/workflows/cloud-deploy.yml`. Triggerlar:
  ```yaml
  on:
    push:
      branches: [development, main]
      paths: ['apps/cloud/**', '.github/workflows/cloud-deploy.yml']
    workflow_dispatch:
      inputs:
        rollback_to: { type: string, required: false }
        rotate_secrets: { type: boolean, default: false }
  ```

## Sonuçlar

### Olumlu

- **Tek workflow, çoklu env:** Tek `cloud-deploy.yml` hem staging hem prod'u sürer; matrix yerine env-aware. CI maintainability yüksek.
- **Wrangler native idiom:** CF resmi pattern'lerini takip ediyoruz; "Wrangler bunu nasıl önerir?" sorusunun cevabı çoğunlukla "öyle." Documentation + community uyumu kolay.
- **Hızlı rollback:** Wrangler deployment history saniyeler içinde dönüş. Production incident MTTR Phase 2 v0'da agresif olarak baseline'a oturur.
- **Single-version uyumu:** Glaon tek ürün, tek version. Kullanıcı / debug / changelog tek hizada — "Glaon v0.3.0 cloud" anlamlı, ayrı paket disiplini olmadan.
- **Backward-compat schema discipline:** Migration pattern (add → migrate → drop) ekibe schema evrimi için net rehber; production'da rolling restart sırasında "kısmi yeni Worker, kısmi eski schema" sorununu önler.

### Olumsuz / ödenecek bedel

- **Cloud bağımsız ritim yok:** Cloud-only hotfix yapmak için bile development → main release döngüsü gerekiyor. Workaround: hotfix branch + cherry-pick + manual `workflow_dispatch` deploy. Olağan olmasa da kapı kapalı değil.
- **Preview-per-PR yok:** PR review sırasında cloud davranışı staging paylaşımı üzerinden test ediliyor; iki paralel PR çakışabilir. Mitigasyon: PR'lar genelde tek-tek staging'e erişir (geliştirici disiplini); v1'de preview deploy tetiklenir (aşağıda).
- **Forward-only DB:** Down migration yok; revert için bilinçli compensating migration yazımı gerekiyor. Ekibe işletim yükü; alternatif (dual-direction migration) implementation maliyeti pratik fayda'ya kıyasla yüksek.
- **GH Actions ↔ Wrangler iki yer:** Secrets iki sistemde tutuluyor (GH Actions + Worker). Drift olabilir (GH'a eklendi, Worker'a put edilmedi). Mitigasyon: deploy workflow her run'da `secret put` çağırır → her CI deploy senkronizasyon noktası.
- **Tek paylaşılan staging:** İki feature aynı anda staging'de QA olduğunda davranış karışabilir. Phase 2 v0 trade-off; v1'de preview-per-PR ile çözülebilir.

### Etkileri

- **B5 (#347) implementation:** `.github/workflows/cloud-deploy.yml` workflow + `apps/cloud/wrangler.toml` `[env.*]` sections + `apps/cloud/migrations/` dizini + initial smoke-deploy gate. PR bu ADR'yi referansla açar.
- **B1 (#343) scaffold:** `wrangler.toml`'un base'i scaffold issue'sunda hazırlanır; environment-spesifik kısım B5'te dolar. Scaffold'da en azından `[env.staging]` placeholder olur.
- **B4 (#346) pairing endpoint:** PAIR_BCRYPT_SECRET secret'i bu pipeline tarafından deploy edilir; ADR 0021'in implementation'ı bu pipeline'a bağlı.
- **Renovate config:** `cloudflare/wrangler-action`, `wrangler` npm package, `@cloudflare/workers-types` Renovate scope'unda; major bump için manuel onay.
- **Sentry release tracking:** `apps/cloud/src/sentry-init.ts` (B1) `process.env.SENTRY_RELEASE`'u okur; CI bunu `git rev-parse HEAD` ile doldurur.
- **`docs/release.md` etkisi:** Cloud release'i ayrı tag almıyor; `apps/cloud` mevcut release-please tag'lerinin altında deploy edilir. release.md'de "cloud-deploy" workflow'una kısa not eklenir (release.md update bu ADR PR'ında değil, B5 PR'ında).

## Tekrar değerlendirme tetikleyicileri

- **Cloud bağımsız major:** `apps/cloud` API contract'ı (ADR 0018 wire protocol) major bir kırılma yaşarsa ve mobile/web release döngüsünden bağımsız iterasyon zorunlu hale gelirse → `apps/cloud` kendi `release-please` paketi olur, ayrı changelog + ayrı tag.
- **Preview-per-PR talebi:** PR review'da staging çakışması ayda >5 kez yaşanırsa veya staging-only bug'lar prod'a sızarsa → preview-per-PR (CF Worker preview deployments) v1 öncesi tetiklenir.
- **MTTR aşımı:** Production incident MTTR > 30dk üç ay üst üste — automated rollback (canary metric'lere göre auto-rollback) value'su yeniden değerlendirilir.
- **Secret leakage incident:** Secret değer log'a düşer veya GH Actions environment secret'ı yanlış env'e atılırsa → secret store'u CF dashboard'unda merkezîleştir, GH Actions yalnız read-only token taşır (Wrangler "fetch from CF" pattern'i).
- **Forward-only migration zarar:** Ekstra "compensating migration" yazımı çok sık olur (ayda >2) — Atlas / Liquibase tarzı bidirectional migration tooling değerlendirilir.
- **Wrangler v5 / runtime breaking change:** CF Wrangler major bump (v5+) syntax'ı kırarsa → ADR güncellenmez, B5 implementation'ı uyarlanır; ADR'in semantik kararları (env ayrımı, secret pipeline, migration pattern) değişmez.

## Referanslar

- Issue [#342 — cloud deployment + secrets pipeline](https://github.com/toss-cengiz/glaon/issues/342) — bu ADR'in tracking issue'su.
- Issue [#347 — B5 CI deploy pipeline](https://github.com/toss-cengiz/glaon/issues/347) — `cloud-deploy.yml` workflow implementation.
- Issue [#343 — B1 apps/cloud scaffold](https://github.com/toss-cengiz/glaon/issues/343) — `wrangler.toml` base hazırlığı.
- Issue [#346 — B4 pairing endpoint](https://github.com/toss-cengiz/glaon/issues/346) — secret pipeline ile deploy.
- [ADR 0020 — cloud hosting (CF Workers + DO)](0020-cloud-hosting-platform.md) — Wrangler tercihi ve D1 migration native tool kararı.
- [ADR 0017 — dual-mode auth](0017-dual-mode-auth.md), [ADR 0019 — Clerk](0019-identity-provider-clerk.md) — Clerk secret'ları cloud env'inde.
- [ADR 0021 — pairing protocol + relay credential lifecycle](0021-pairing-and-relay-credentials.md) — bcrypt secret cloud'da; bu pipeline ile deploy edilir.
- [`docs/release.md`](../release.md) — release-please akışı; bu ADR onunla uyumlu.
- [`release-please-config.json`](../../release-please-config.json) — single-version monorepo manifest.
- Wrangler multiple environments: <https://developers.cloudflare.com/workers/wrangler/configuration/#environments>
- Wrangler secret management: <https://developers.cloudflare.com/workers/configuration/secrets/>
- Wrangler rollback: <https://developers.cloudflare.com/workers/wrangler/commands/#rollback>
- D1 migrations: <https://developers.cloudflare.com/d1/reference/migrations/>
