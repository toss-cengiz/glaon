# `@glaon/ui` Design Tokens

Bu dizin, Glaon Figma dosyalarındaki **Variables** + **Paint/Effect/Text Styles** kaynaklarının Style Dictionary–uyumlu JSON yansımasıdır. Componentler hex/px literal kullanmaz; bu JSON'lardan F2'de üretilen CSS vars (`web.css`) ve RN modülünü (`rn.ts`) tüketir.

## Dosyalar

Export script Figma'daki tüm yerel token kaynaklarını okur ve her biri için JSON üretir:

- **Variables** — her `(koleksiyon × mode)` için bir dosya:
  - Tek modlu: `<koleksiyon>.json` (örn. `primitives.json`)
  - Çok modlu: `<koleksiyon>.<mode>.json` (örn. `semantic.light.json`, `semantic.dark.json`)
  - İsimler kebab-case (`Brand Primitives` → `brand-primitives`).
- **Paint Styles** → `paint-styles.json` — color/fill stilleri (Brand Guideline tarzı klasik color styles).
- **Effect Styles** → `effect-styles.json` — drop/inner shadow stilleri.
- **Text Styles** → `text-styles.json` — typography stilleri (font family, weight, size, line-height, letter-spacing).

Hangi dosyaların gerçekten geleceği Figma dosyasının yapısına bağlıdır — script çalıştırıldığında iframe'in en üstünde keşfedilen kaynakların envanteri tablo olarak listelenir.

## Şema

**Style Dictionary v3-uyumlu plain shape** (DTCG değil):

```json
{
  "<seg1>": {
    "<seg2>": { "value": "...", "type": "color" }
  }
}
```

Variable veya Style isimlerindeki `/` ayırıcısı path'e dönüşür ve her segment kebab-case'e çevrilir (`Color/Brand/Primary` → `color.brand.primary`).

Type değerleri:

- `color` — solid hex (`#rrggbb` veya `#rrggbbaa`); gradient için CSS string (`linear-gradient(...)`).
- `dimension` — number (px birimi F2 transform katmanında eklenir).
- `shadow` — object: `{inset, x, y, blur, spread, color}` (birden fazla shadow varsa array).
- `typography` — object: `{fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, ...}`.
- `string`, `boolean` — Figma Variables string/boolean tipleri için.

Variable aliases şu formatta serialize edilir:

```
"{<target-collection>.<segment>.<segment>}"
```

Hedef collection prefix'i, birden fazla koleksiyon dosyası birlikte yüklendiğinde isim çakışmasını önler.

## Yenileme akışı

Figma'daki kaynaklar değişti → bu JSON'ları `tools/figma-plugin/scripts/05-tokens-export.js` ile yeniden üret:

1. Script içeriğini `tools/figma-plugin/code.js` üzerine kopyala.
2. Figma desktop'ta hedef dosyayı (Brand Guideline veya Design System) aç.
3. Plugins → Development → Glaon → çalıştır.
4. Açılan iframe'de:
   - **Discovered token sources** tablosu en üstte (Variables collection'ları, Paint/Effect/Text Styles count'ları).
   - Altında her dosya için bir bölüm: **Copy** (paste hedef dosyaya) ya da **Download** (Save As ile bu dizine).
5. `git diff` ile değişiklikleri review et, commit et.
6. `git restore tools/figma-plugin/code.js` — scaffold'a geri dön.

Script idempotent ve read-only: aynı Figma state aynı JSON üretir, mutasyon yok, network yok.

## Tüketim (F2 sonrası)

`pnpm --filter @glaon/ui build:tokens` JSON dosyalarını okur, Style Dictionary üzerinden:

- `dist/tokens/web.css` — `:root { --color-…; }` light, `[data-theme='dark'] { … }` dark override.
- `dist/tokens/rn.ts` — `export const Theme = { light: {...}, dark: {...} } as const`.

Componentler `var(--token-…)` (web) veya `Theme.light.color.brand.primary` (RN) referans eder.

## Sınırlar

- **Yeni token ekleme**: Brand-decision issue gerekir (#137/#138/#139 pattern'i). Figma'da güncel hale gelmeden export çalıştırılır ama eksik token consumer tarafında render hatasına yol açar.
- **Path çakışması**: Aynı kebab path iki kez set edilirse son yazan kazanır — Figma'da segment isimlerinde sadece case farkı olan duplicate'ler tehlikeli.
- **Gradient & complex paints**: Solid + linear/radial gradient destekli; image fills, video fills veya pattern'ler `null` döner ve dosyaya yazılmaz.
- **Multi-shadow effect styles**: Birden fazla shadow içeren effect style array olarak serialize edilir — Style Dictionary transform katmanı F2'de bunu shadow stack'ine çevirir.

## Referanslar

- `tools/figma-plugin/scripts/05-tokens-export.js` — export script'i.
- `docs/design-system-bootstrap.md` — Variables koleksiyonları, Theme: Light/Dark mode'ları, Semantic taksonomi.
- `docs/figma.md` — Figma file ladder, token akışı.
- F2 issue: Style Dictionary build.
