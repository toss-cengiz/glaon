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

## İlişkili kontrolller

- **Lighthouse CI** (#102) — performance/perceived metrics (LCP, TBT). size-limit'i tamamlar: byte-size vs render-time.
- **Vite build warnings** — `pnpm --filter @glaon/web build` zaten her chunk için gzipped boyutu yazar; size-limit bu rapora policy ekler.

## Referanslar

- size-limit config: [apps/web/.size-limit.json](../apps/web/.size-limit.json)
- CI job: [.github/workflows/ci.yml](../.github/workflows/ci.yml) `size-check`
- İlgili issue: #93 (size-limit), #102 (Lighthouse CI planned).
