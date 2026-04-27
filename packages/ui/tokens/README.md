# `@glaon/ui` Design Tokens

Bu dizin, Glaon Design System Figma dosyasındaki **Variables** koleksiyonlarının Style Dictionary–uyumlu JSON yansımasıdır. Componentler hex/px literal kullanmaz; bu JSON'lardan F2'de üretilen CSS vars (`web.css`) ve RN modülünü (`rn.ts`) tüketir.

## Dosyalar

Export script Figma'daki **her local Variables koleksiyonu × her mode** için bir JSON üretir. Dosya isimlendirme:

- Tek modlu koleksiyon → `<collection>.json` (örn. `primitives.json`).
- Çok modlu koleksiyon → `<collection>.<mode>.json` (örn. `semantic.light.json`, `semantic.dark.json`).

Koleksiyon ve mode isimleri kebab-case'e çevrilir (`Brand Primitives` → `brand-primitives`).

İlk export sonrası bu dizinde tipik içerik (Glaon'un mevcut taksonomisinde):

- `primitives.json` — ham scale (color/space/radius/shadow). Tek mode.
- `semantic.light.json` — Semantic role bağlamaları (surface/text/border/brand/state) Light mode.
- `semantic.dark.json` — aynı Semantic isimleri, Dark mode bağlamaları. #140 yeniden açılana dek çoğu Dark binding Light primitive'e fallback eder; isimler sabittir, yalnız değerler güncellenir.

Hangi dosyaların gerçekten geleceği Figma'daki koleksiyon yapısına bağlıdır — script çalıştırıldığında iframe'in en üstünde keşfedilen koleksiyonlar tablo olarak listelenir.

## Şema

**Style Dictionary v3-uyumlu plain shape** (DTCG değil):

```json
{
  "<seg1>": {
    "<seg2>": { "value": "...", "type": "color" }
  }
}
```

Variable isimlerindeki `/` ayırıcısı path'e dönüşür. Aliases şu formatta serialize edilir:

```
"{<target-collection>.<segment>.<segment>}"
```

Hedef collection prefix'i, birden fazla koleksiyon dosyası birlikte yüklendiğinde isim çakışmasını önler. Style Dictionary `references` alanını bu prefix'le çözer (F2'de transform katmanı mapping yapar).

## Yenileme akışı

Figma Variables değişti → bu JSON'ları `tools/figma-plugin/scripts/05-tokens-export.js` ile yeniden üret:

1. Script içeriğini `tools/figma-plugin/code.js` üzerine kopyala.
2. Figma desktop'ta **Design System** dosyasını aç.
3. Plugins → Development → Glaon → çalıştır.
4. Açılan iframe'de keşfedilen koleksiyonların envanteri en üstte; altında her dosya için bir bölüm. Her bölümde **Copy** (paste hedef dosyaya) ve **Download** (Save As ile bu dizine).
5. `git diff` ile değişiklikleri review et, commit et.
6. `git restore tools/figma-plugin/code.js` — scaffold'a geri dön.

Script idempotent ve read-only: aynı Figma state aynı JSON üretir, mutasyon yok, network yok.

## Tüketim (F2 sonrası)

`pnpm --filter @glaon/ui build:tokens` JSON dosyalarını okur, Style Dictionary üzerinden:

- `dist/tokens/web.css` — `:root { --color-…; }` light, `[data-theme='dark'] { … }` dark override.
- `dist/tokens/rn.ts` — `export const Theme = { light: {...}, dark: {...} } as const`.

Componentler `var(--token-…)` (web) veya `Theme.light.color.brand.primary` (RN) referans eder.

## Sınırlar

- **Yeni token ekleme**: Brand-decision issue gerekir (#137/#138/#139 pattern'i). Figma'da Variables güncel hale gelmeden export çalıştırılır ama eksik token consumer tarafında render hatasına yol açar.
- **Path çakışması**: Aynı path iki kez set edilirse son yazan kazanır — Figma'da duplicate variable olmamalı.
- **Placeholder değerler**: Brand Guideline'da değeri henüz tanımlanmamış primitive'ler magenta (`#ff00ff`) ile işaretlidir; export'ta literal hex olarak görünür. Brand-decision issue kapanınca Figma'da güncellenir, sonra yeniden export edilir.

## Referanslar

- `tools/figma-plugin/scripts/05-tokens-export.js` — export script'i.
- `docs/design-system-bootstrap.md` — Variables koleksiyonları, Theme: Light/Dark mode'ları, Semantic taksonomi.
- `docs/figma.md` — Figma file ladder, token akışı.
- F2 issue: Style Dictionary build.
