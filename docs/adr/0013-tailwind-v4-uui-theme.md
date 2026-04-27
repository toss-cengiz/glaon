# ADR 0013 — Tailwind v4 + Untitled UI theme.css'i `@glaon/ui` paketinde benimse

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-27
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue #219, issue #215, [ADR 0011](0011-untitled-ui-react-kit.md), Superseded ADR: [ADR 0012](0012-tailwind-css-for-glaon-ui.md)

## Bağlam

ADR 0012 Tailwind v3'ü benimsemiş ve `tailwind.config.js` dosyasında token mapping kurmuştu. #215 (UUI Button source import) keşfetti: Untitled UI Pro **Tailwind v4** kullanıyor — `@import "tailwindcss"`, `@theme` block, `@plugin` directives, `@custom-variant` syntax. Kit Button'un Tailwind class'ları (`bg-brand-solid`, `text-error-primary`, `outline-brand`, `shadow-xs-skeuomorphic`, `mask-b-from-0%`) UUI'nin kendi `theme.css` ve plugin set'inde tanımlı. v3 + manuel config bu semantic katmanı veremez.

Tetikleyici keşif: `npx untitledui init <dir> --vite -c brand` ile sandbox scaffold incelendi:

- `tailwindcss@^4.2.2` runtime.
- `@tailwindcss/vite` plugin Vite config'ine bağlanıyor (`postcss.config.js` artık opsiyonel).
- `src/styles/theme.css` 856 satır CSS-based config — UUI'nin tüm semantic token'ları ve color scale'leri.
- `src/styles/globals.css` `@import "tailwindcss"` + `@import "./theme.css"` + `@import "./typography.css"` + plugin'ler (`tailwindcss-react-aria-components`, `tailwindcss-animate`, `@tailwindcss/typography`).

Göz önünde bulundurulan alternatifler:

- **Seçenek A — v3'te kal, kit class'larını manuel port et**: Her UUI Button class'ını manuel CSS'e dönüştür, kit upgrade'i her seferinde elden geçer. Sürdürülemez.
- **Seçenek B — v4'e migrate + UUI theme.css'i kopyala (seçilen)**: Kit'in beklediği stack'i ada. Theme.css + plugin chain UUI scaffold'tan repo'ya kopyalanır; Glaon brand override'ı F2'nin token'larıyla `theme.css`'in üzerine yapılır.
- **Seçenek C — UUI Pro'dan vazgeç + Radix UI**: ADR 0011'i yeniden supersede et. Kit kullanmıyoruz, hand-rolled CSS-in-JS. ADR 0012'i geri al. Kararın daha büyük çevresi alt-üst olur.

## Karar

ADR 0012 **Superseded by ADR 0013**. `@glaon/ui` paketi Tailwind v4 + UUI scaffold'unun `theme.css` + `globals.css` + `typography.css` dosyaları üzerinden çalışır. Vite plugin chain Storybook ve gelecek consumer'lar için `@tailwindcss/vite` üzerinden bağlanır.

Kararın teknik detayları:

- **Versiyon**: `tailwindcss@^4.2.2` (UUI scaffold ile aynı).
- **Dep'ler `@glaon/ui` devDep**:
  - Kaldırıldı: `tailwindcss@^3`, `postcss`, `autoprefixer`.
  - Eklendi: `tailwindcss@^4`, `@tailwindcss/vite`, `tailwindcss-react-aria-components`, `tailwindcss-animate`, `@tailwindcss/typography`.
- **Vite plugin**: `.storybook/main.ts`'in `viteFinal`'ı `@tailwindcss/vite` plugin'ini ekler. `postcss.config.js` artık yok — Vite plugin chain v4'te yeterli.
- **Style dosyaları** (UUI scaffold'tan kopyalandı):
  - `packages/ui/src/styles/theme.css` — UUI'nin token + semantic class tanımları (`@theme` block).
  - `packages/ui/src/styles/typography.css` — typography utility'leri.
  - `packages/ui/src/styles/globals.css` — orchestrator (`@import "tailwindcss"`, `@import "./theme.css"`, `@import "./typography.css"`, `@plugin` directives, `@custom-variant`).
- **Storybook preview**: `dist/tokens/web.css` (F2 — Glaon brand) sonra `globals.css` (UUI theme + Tailwind utilities). Sıralama önemli — F2'nin custom property'leri UUI theme.css'in `@theme` block'unun altına gelmez; Glaon brand override ayrı bir CSS dosyasıyla `theme.css`'in **sonrasında** uygulanır (ek slice; bu issue minimum migration ile sınırlı).
- **`tailwind.config.js` ve `postcss.config.js` silindi** — v4 CSS-based config dosyaların yerine geçti.
- **CLAUDE.md Stack** güncellenir: "Tailwind CSS v4 + UUI theme + react-aria-components".

## Sonuçlar

### Olumlu

- **Kit fidelity**: Kit Button source `bg-brand-solid`, `text-error-primary`, `outline-brand` gibi semantic class'larını doğrudan render eder. Manuel port maliyeti sıfır; kit upgrade'leri seamless.
- **Sürdürülebilir token akışı**: UUI'nin `theme.css` semantic katmanı + Glaon F2 token'ları üst üste binerek çalışır; brand override CSS-only ek bir dosya.
- **Modern Vite entegrasyonu**: `@tailwindcss/vite` plugin v4'ün resmi Vite yolu — Storybook + future apps doğrudan tüketir.
- **Plugin'ler hazır**: `react-aria-components` Tailwind compatibility (utility class state'leri), `tailwindcss-animate` (kit animation'ları), `@tailwindcss/typography` (markdown/long-form için) zaten kurulu.
- **CI süresi**: v4 native compile v3'ten hızlı (Lightning CSS tabanlı).

### Olumsuz / ödenecek bedel

- **v4 ekosistem yenilik**: v4 stable ama topluluk dokümanları + 3rd-party plugin uyumluluğu hâlâ olgunlaşıyor. Bazı eski plugin'ler v4 ile uyumsuz olabilir; problem çıkarsa case-by-case.
- **Theme.css 856 satır**: UUI scaffold'tan kopyalanan büyük dosya. Kit upgrade'i `@untitledui/react upgrade` bu dosyayı da güncelleyecek mi? CLI'nın upgrade davranışı henüz net değil — manuel bir `cp` adımı gerekebilir.
- **Glaon brand override**: F2'nin `--brand-500` token'larını UUI'nin `--color-brand-500` token'larına bağlamak ek bir CSS dosyası gerektirir. Bu issue minimum migration scope'unda — override ayrı slice (#215'te veya hemen sonrası).
- **postcss.config.js kaybı**: Eğer Glaon ileride başka PostCSS plugin (örn. cssnano) eklemek isterse, `@tailwindcss/postcss` v4 plugin'ine dönüş veya başka bir Vite plugin kurulumu gerekir.

### Etkileri

- **Kod organizasyonu**: `packages/ui/src/styles/` UUI'nin asset dosyaları; component dosyaları kit class'larını doğrudan kullanır.
- **`apps/web` ve `apps/mobile` shell'leri**: Bu issue `@glaon/ui` ile sınırlı. Apps'ler Tailwind çıkarımını consumer olarak almazsa kit class'ları render edilmez — Phase 2'de `apps/web` Tailwind setup'ı gerekir.
- **Göç yolu**: v3 → v4 dönülmez bir köprü değil; v4'te kalınmasını gerektiren tek şey UUI Pro'nun v4 stack'i. UUI'den vazgeçilirse v4 kararı kit'ten bağımsız değerli kalmaya devam eder.

## Tekrar değerlendirme tetikleyicileri

- UUI scaffold v5'e geçerse (gelecekte) — yeni ADR.
- v4'te critical bug / regression bulunursa.
- Glaon F2 token'ları + UUI theme.css'in iç içe geçmesi sürdürülemez hale gelirse — alternative theme strategy.

## Referanslar

- Issue #219 — bu ADR'nin uygulayıcı slice'ı.
- Issue #215 — UUI Button import (bu PR ön-koşulu, sonrasında inşa eder).
- ADR 0011 — UUI CLI source-based delivery (parent context).
- ADR 0012 — Tailwind v3 (superseded by this ADR).
- Tailwind v4 docs: <https://tailwindcss.com/docs>
- UUI scaffold: `npx untitledui@latest init <dir> --vite -c brand`.
