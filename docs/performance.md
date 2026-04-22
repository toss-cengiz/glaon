# Performans bütçeleri

Glaon'un birincil hedefi tablet + mobil — ağır olduğu an kullanıcının hissedeceği yer. Bu dökümantasyonun amacı: bundle şişkinliğini upgrade akışında (yeni dep, yeni import, transitive bloat) geç değil, PR zamanında yakalamak.

## Web bundle budget (`size-limit`)

[size-limit](https://github.com/ai/size-limit) `apps/web` Vite production build'ı üzerinden gzipped byte-size ölçer. Config `apps/web/.size-limit.json` içinde; değer aşıldığında CI fail eder.

### Mevcut bütçeler

| İsim                     | Glob                     | Limit (gzipped) | Şu anki baseline |
| ------------------------ | ------------------------ | --------------- | ---------------- |
| **Initial JS (gzipped)** | `dist/assets/index-*.js` | 180 kB          | ~88 kB           |
| **Total JS (gzipped)**   | `dist/assets/**/*.js`    | 250 kB          | ~88 kB           |

CSS bütçesi (40 kB gzipped) şu an config'te yok — web henüz CSS emit etmiyor (inline style + tailwind olmadığı için). `size-limit` glob'u boş eşleşirse fail eder, bu yüzden entry'yi ilk stylesheet import'u eklendiği anda (aynı PR'da) config'e eklemek gerekir. O ana kadar CSS kategorisinin bütçesi yok; bu bilinçli bir carve-out.

### Neden bu değerler

- **180 kB initial** — Current baseline ~88 kB, ~2x headroom. React 19 + routing + core auth + HA WebSocket client (henüz hiçbiri yok; scaffold only) girdiği noktada bu alan dolar. Tablet 3G fallback scenario'sunda 180 kB gzipped ~2s indirme; cold-load'u kabul edilebilir tutuyor.
- **250 kB total** — Initial JS + async chunks. Code-splitting henüz yok; split başladığında async chunk'lar bu headroom'un içinden gider. Total bütçe, initial'ın ~1.4x'i — code-splitting'in asıl faydasını (initial shrink) yakalar.

Bütçeler "tune after baseline" ile başlamış bir rakam. Baseline'dan ~2x sınırı ilk sürüm için bilinçli bir "gelişim alanı var ama regresyon yakalanır" dengesi.

### Yerel çalıştırma

```bash
# Kök-level (tüm workspace'ler, turbo cache'li):
pnpm size

# Sadece web:
pnpm --filter @glaon/web size
```

İkisi de önce `pnpm build` koşar (turbo `dependsOn: ["build"]`), sonra `size-limit` ile ölçer. İlk çalıştırmada build tamamı; sonraki çalıştırmalarda cache hit.

Lokalde `VITE_SENTRY_DSN` dummy bir değer olmadan `vite build` fail eder (prod-build guard). Kullanışlı örnek:

```bash
VITE_SENTRY_DSN="size-check-dummy" pnpm size
```

CI bu env değerini job-level olarak sağlıyor — lokal'de CI'daki gibi çalıştırmak istersen aynı şeyi yap.

### CI entegrasyonu

`.github/workflows/ci.yml` → `size-check` job:

- Her PR'da koşar (path filter yok — iş ~30s, filter için ek action dependency şu an overkill).
- `VITE_SENTRY_DSN=size-check-dummy` env ile prod-build guard'ı geçer; Sentry plugin'i `SENTRY_AUTH_TOKEN + ORG + PROJECT` olmadan yüklenmiyor, artifact'lar da hiçbir yere publish edilmiyor.
- Bütçe aşıldığında job fail eder; PR body'sindeki delta ile görünür.

### Bütçe değişiklik kuralı

Bütçe yukarı bump edilmeden önce **nedeni bağımsız bir issue'da tartışılır**. Tipik senaryolar:

- **Kabul edilen yeni feature** (örn. chart library) — issue'da beklenen byte maliyeti + alternatifler değerlendirilir, sonra bütçe artırılır.
- **Regression sonrası tune-down** — baseline kendi doğal haliyle düştüyse bütçe de daralır (baseline'a ~2x tamponun altında tutulur).

Bir dep upgrade'i "istemeden" bütçeyi aştığında çözüm bütçeyi yükseltmek değil — dep'in alternatifini veya code-splitting stratejisini düşünmek. Bütçe sinyal olarak çalışmak için dar tutulur.

### Yeni budget entry'si nasıl eklenir

1. `apps/web/.size-limit.json` → yeni obje:
   ```jsonc
   {
     "name": "İsim (gzipped)",
     "path": "dist/assets/<glob>",
     "limit": "N kB",
     "gzip": true,
   }
   ```
2. `path` boş eşleşirse `size-limit` fail eder — entry'yi yalnızca eşleşen artifact build çıktısında garantili olduğunda ekle.
3. Baseline + 1.5–2x headroom ile başla; öncesinde 1-2 haftalık gerçek kullanımda sabitle.
4. Bu dökümanın tablosuna satır ekle, "Neden bu değer" listesine gerekçe.

## Render-time budget (Lighthouse CI)

[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) size-limit'i byte-size tarafında bıraktığı yeri tamamlıyor: aynı bundle farklı runtime davranışı verebilir (parse cost, hydration, main-thread block). LCP/TBT/CLS + Performance skoru bu eksende ölçülüyor.

### Preset'ler ve bütçeler

İki ayrı config + iki ayrı CI job (matrix):

| Preset      | Config                     | Perf skor | LCP     | TBT      | CLS   | Throttling                             |
| ----------- | -------------------------- | --------- | ------- | -------- | ----- | -------------------------------------- |
| **desktop** | `.lighthouserc.cjs`        | ≥ 0.9     | < 2.5 s | < 200 ms | < 0.1 | Lighthouse `desktop` preset            |
| **mobile**  | `.lighthouserc.mobile.cjs` | ≥ 0.8     | < 2.5 s | < 200 ms | < 0.1 | Lighthouse default (Slow 4G + Moto G4) |

Perf skoru desktop'ta daha sıkı çünkü runtime ucuzluğu orada tam kontrol altında; mobile sim-throttled testte 0.8 "good" endüstri standardı.

Metric eşikleri ([Web Vitals](https://web.dev/articles/vitals) "good" bantlarını takip eder):

- **LCP < 2.5s** — "largest contentful paint", kullanıcının içeriğin yüklendiğine inandığı an.
- **TBT < 200ms** — total blocking time, etkileşim gecikmesinin proxy'si.
- **CLS < 0.1** — cumulative layout shift, görsel kararlılık.

### Çalışma mantığı

LHCI autorun:

1. `startServerCommand` → `pnpm --filter @glaon/web preview -- --port 4173 --strictPort` ile Vite preview kalkar.
2. Chrome headless (CI'da `--no-sandbox --headless=new`) 3 kez (`numberOfRuns: 3`) sayfayı ziyaret eder; medyan raporu alınır.
3. Assertion listesi medyan rapora karşı çalıştırılır; eşikler aşılırsa job fail.
4. Raporlar `upload.target: temporary-public-storage` ile Google CDN'e yüklenir (geçici, ~7 gün). Link'ler `$GITHUB_STEP_SUMMARY`'ye basılır.

### Yerel çalıştırma

Önce `apps/web/dist/` hazır olmalı. Lokalde Chrome kurulu olmadan çalışmaz — LHCI healthcheck "Chrome installation not found" ile fail eder. CI hedefli bir check.

```bash
# Build'i tazele:
VITE_SENTRY_DSN="lhci-dummy" pnpm --filter @glaon/web build

# Tek preset:
pnpm lhci:desktop
pnpm lhci:mobile

# Her ikisi:
pnpm lhci
```

Chrome için: [Google Chrome indir](https://www.google.com/chrome/) ya da `brew install --cask google-chrome`. LHCI `chrome-launcher` ile kurulu binary'yi otomatik bulur.

### CI entegrasyonu

`.github/workflows/lighthouse.yml` — `ci.yml`'dan ayrı bir workflow. Sebep: Lighthouse her run ~2-3 dakika × 2 preset ≈ 5-6 dk; her PR'da koşturmak CI bütçesini şişirir. Path filter'lı yaklaşım:

```yaml
paths:
  - 'apps/web/**'
  - 'packages/ui/**'
  - '.lighthouserc.cjs'
  - '.lighthouserc.mobile.cjs'
  - '.github/workflows/lighthouse.yml'
```

Yani docs-only PR'lar veya `packages/core`/`@glaon/config`/mobile-only değişiklikler Lighthouse'ı tetiklemez. İlgili path'e değen her PR'da desktop + mobile paralel (matrix `fail-fast: false`) koşar.

`VITE_SENTRY_DSN=lighthouse-dummy` job-level env ile Vite prod-build guard'ı geçirilir; Sentry vite plugin'i `SENTRY_AUTH_TOKEN + ORG + PROJECT` olmadan yüklenmiyor.

### Bütçe değişiklik kuralı

size-limit ile aynı felsefe:

- **Yeni feature** bütçeyi zorluyorsa — issue'da byte + render cost tartışılır, kabul edilen feature için bütçe tune edilir.
- **Regresyon** — önce kaynak değişim aranır (yeni dep? yeni main-thread iş? hydration sorunu?); bütçe en son yükseltilir.
- **Flake** — LHCI CI runner'lardaki varyanstan ötürü nadiren flake olabilir. `numberOfRuns: 3` median çoğu varyansı kapatır; persistent flake varsa fix önce (tests/config), bütçe gevşetme değil.

### Baseline notu

Bu PR açıldığında `apps/web` boş bir React scaffold — real content yok. Score'lar doğal olarak 99-100 civarı olacak. **Bütçe anlamlı sinyal için tune edilecek** feature landing'leri başladıkça: ilk HA integration + Untitled UI primitive'leri inerken baseline gerçek olur, bütçe o zaman (ayrı issue ile) daraltılır.

## İlişkili kontroller

- **size-limit** (bu doküman, yukarıda) — byte-size tarafı, statik ölçüm.
- **Vite build warnings** — `pnpm --filter @glaon/web build` zaten her chunk için gzipped boyutu yazar; size-limit bu rapora policy ekler.

## Referanslar

- size-limit config: [apps/web/.size-limit.json](../apps/web/.size-limit.json)
- LHCI desktop config: [.lighthouserc.cjs](../.lighthouserc.cjs)
- LHCI mobile config: [.lighthouserc.mobile.cjs](../.lighthouserc.mobile.cjs)
- size-check CI job: [.github/workflows/ci.yml](../.github/workflows/ci.yml)
- Lighthouse CI workflow: [.github/workflows/lighthouse.yml](../.github/workflows/lighthouse.yml)
- İlgili issue: #93 (size-limit), #102 (Lighthouse CI).
