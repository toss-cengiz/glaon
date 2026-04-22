# ADR 0008 — Chromatic tek görsel regresyon aracı

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-21
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [docs/chromatic.md](../chromatic.md), [docs/storybook.md](../storybook.md), [CLAUDE.md — Chromatic Visual Regression](../../CLAUDE.md#chromatic-visual-regression-mandatory)

## Bağlam

Glaon UI'ını her platform için aynı tasarım sistemi beslerken, görsel kaymayı erken yakalamak zorunlu:

- `@glaon/ui` paketi Untitled UI React kit'ini sarıyor — upstream paketten stil drift'i riski her zaman var.
- Web + tablet + mobile paylaşılan primitive'ler üzerinden render ediliyor.
- Manuel QA tek kişilik ekipte zaman darboğazı.
- Storybook zaten var (Storybook 10), story'ler "component dokümantasyon + test fikstürü" olarak iki amaca hizmet ediyor.

Değerlendirilen seçenekler:

- **Chromatic (SaaS):** Storybook team tarafından sahipleniyor, Storybook ile sıkı entegre. Otomatik screenshot karşılaştırma, accept/deny akışı, Figma design-code diff, TurboSnap ile incremental build. Ücretsiz tier kişisel proje için yeterli.
- **Percy (BrowserStack):** Chromatic'e rakip, Storybook entegrasyonu var ama daha zayıf. Pricing küçük projeler için Chromatic kadar cömert değil.
- **Playwright + manuel screenshot diff:** Kendi yazdığımız screenshot testi + baseline depolama. Dezavantaj: baseline yönetimi elle, kolorimetrik tolerans, platform-farkı noise'u (font rendering) kendi kendine çözülmüyor.
- **Loki / Storycap + reg-suit:** OSS Storybook visual regression stack. Kendi CI job'unu barındırmak gerekiyor. Kurulum ağır, aktif geliştirme yavaş.
- **Vercel Toolbar + E2E visual:** Vercel ekosistemine bağlı; Glaon bu ekosistem dışında.

Ek kriterler Glaon'a özel:

- **Figma design-code diff** — tasarım kaynağı (ADR 0010) değiştiğinde kod tarafı da tetiklenmeli. Chromatic'in Figma entegrasyonu bu akışı kutudan sağlıyor (`storybook-id` ↔ Figma component description eşlemesi).
- **MCP entegrasyonu** — Chromatic remote MCP endpoint'i Claude Code'dan okunabiliyor; docs ve workflow asistansı için değer yaratıyor (#54).

## Karar

**Chromatic, Glaon için tek görsel regresyon aracı olarak kullanılır.**

- `CHROMATIC_PROJECT_TOKEN` repo secret'ı; `.github/workflows/chromatic.yml` her PR'da publish + tests.
- `exitZeroOnChanges: false` — her piksel değişikliği merge'u bloklar.
- `autoAcceptChanges: development` — `development` baseline branch; merge edilenler yeni baseline.
- Skip list: `dependabot/**` ve `release-please--**` (dashboard eklenir).
- Chromatic ↔ Figma design-code diff aktif; Storybook story'leri Figma description'ındaki `storybook-id: <kebab-case>` ile bağlı.
- Chromatic MCP entry `.mcp.json`'da repo contract olarak tutulur; drive-by değişiklik yasak.

## Sonuçlar

### Olumlu

- Her PR'da görsel regresyon bir status check; unintended pixel değişikliği merge'u bloklar.
- Chromatic UI'daki accept/deny akışı baseline yönetimini netleştiriyor — kararlar PR tartışmasıyla aynı yerde.
- TurboSnap ile incremental build CI süresini düşürüyor.
- Figma design-code diff tasarım-kod drift'ini erken sinyalliyor; "implementasyon gerçekten spec'e uyuyor mu" sorusu otomatikleşiyor.
- MCP entegrasyonu geliştirme sırasında docs/asistans için ek değer.

### Olumsuz / ödenecek bedel

- SaaS bağımlılığı: Chromatic down olursa CI bloklanıyor (retry mekanizması var ama edge case mevcut).
- Ücretsiz tier snapshot limiti; büyüdükçe ödeme gündeme gelebilir.
- TurboSnap bazı edge case'lerde eksik snapshot'tan kaynaklı false negative riski taşıyabilir; skip list yönetimi dikkat istiyor.
- Figma design-code diff yeni özellik; "Not implemented" / "Design changed" işaretleri bazen gerçek drift değil configuration glitch — tasarımla manuel senkronizasyon gerek.

### Etkileri

- [CLAUDE.md — Chromatic Visual Regression](../../CLAUDE.md#chromatic-visual-regression-mandatory) kuralı her PR'da geçerli.
- `packages/ui` içindeki her yeni primitive aynı PR'da bir Storybook story + story id + Figma eşlemesi getirmek zorunda ([docs/storybook.md](../storybook.md) + [docs/figma.md](../figma.md)).
- `.github/workflows/chromatic.yml` zip'i ve `.mcp.json` entry'si repo contract parçası, drive-by edit yasak.

## Tekrar değerlendirme tetikleyicileri

- Chromatic fiyatlandırması küçük projeyi aşan düzeyde değişirse.
- Chromatic SaaS'ın kritik downtime pattern'ı yaşarsa ve alternatif yeterince olgunlaşırsa.
- OSS reg-suit ekosistemi kendi CI'ımızda sürdürebileceğimiz kalitede bir çözüm üretirse (çok düşük olasılık).

## Referanslar

- [docs/chromatic.md](../chromatic.md)
- [docs/storybook.md](../storybook.md)
- [docs/figma.md](../figma.md)
- [Chromatic docs](https://www.chromatic.com/docs/)
- [CLAUDE.md — Chromatic Visual Regression](../../CLAUDE.md#chromatic-visual-regression-mandatory)
