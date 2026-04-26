# `@glaon/ui` Design Tokens

Bu dizin, Glaon Design System Figma dosyasındaki **Variables** koleksiyonlarının (Primitives + Semantic) Style Dictionary–uyumlu JSON yansımasıdır. Componentler hex/px literal kullanmaz; bu JSON'lardan F2'de üretilen CSS vars (`web.css`) ve RN modülünü (`rn.ts`) tüketir.

## Kanonik dosyalar

- `primitives.json` — ham scale (color/sand-100, color/night-blue-500, space, radius, shadow). Tek mod (Light primitive değerleri).
- `semantic.light.json` — Light mode'daki Semantic role bağlamaları (`surface/default`, `text/primary`, `brand/primary`, …). Değerler ya `{primitive.path}` referansı ya da literal.
- `semantic.dark.json` — aynı Semantic isimleri, Dark mode bağlamaları. #140 yeniden açılana dek çoğu Dark binding Light primitive'e fallback eder; isimler değişmez, yalnız değerler güncellenir.

Üçü de **Style Dictionary v3-uyumlu plain shape** kullanır (DTCG değil): `{ "<seg>": { "<seg>": { "value": "...", "type": "color" } } }`.

## Yenileme akışı

Figma Variables değişti → bu JSON'ları `tools/figma-plugin/scripts/05-tokens-export.js` ile yeniden üret:

1. Script'i `tools/figma-plugin/code.js` üzerine kopyala.
2. Figma desktop'ta **Design System** dosyasını aç.
3. Plugins → Development → Glaon → çalıştır.
4. Açılan iframe'de her dosya için ya **Copy** (paste hedef dosyaya) ya da **Download** (Save As ile bu dizine).
5. `git diff` ile değişiklikleri review et, commit et.
6. `git restore tools/figma-plugin/code.js` — scaffold'a geri dön.

Script idempotent: aynı Figma state aynı JSON üretir. Yenileme her zaman güvenli.

## Tüketim (F2 sonrası)

`pnpm --filter @glaon/ui build:tokens` üç JSON dosyasını okur, Style Dictionary üzerinden:

- `dist/tokens/web.css` — `:root { --color-…; }` light, `[data-theme='dark'] { … }` dark override.
- `dist/tokens/rn.ts` — `export const Theme = { light: {...}, dark: {...} } as const`.

Componentler `var(--token-…)` (web) veya `Theme.light.color.brand.primary` (RN) referans eder.

## Sınırlar

- **Yeni semantic ekleme**: Brand-decision issue gerekir (#137/#138/#139 pattern'i). Figma'da Variables güncel hale gelmeden export çalıştırma; aksi halde JSON schema bozulur.
- **Hex çakışması**: Aynı path iki kez set edilirse son yazan kazanır — Figma'da duplicate variable olmamalı (bootstrap script idempotent garantisi verir).
- **Placeholder magenta** (`#ff00ff`): `01-variables-bootstrap.js` Brand Guideline değeri eksik primitive'leri görsel olarak işaretler. Export'ta literal hex olarak görünür; component'ler beklenenden farklı render eder. Brand-decision issue kapanınca yeniden çalıştır.

## Referanslar

- `tools/figma-plugin/scripts/05-tokens-export.js` — export script'i.
- `docs/design-system-bootstrap.md` — Variables koleksiyonları, Theme: Light/Dark mode'ları, Semantic taksonomi.
- `docs/figma.md` — Figma file ladder, token akışı.
- F2 issue: Style Dictionary build.
