# Design System Bootstrap

Glaon Design System Figma dosyasını ([KP0SVNxQEjT0gotajwc9I0/Design-System](https://www.figma.com/design/KP0SVNxQEjT0gotajwc9I0/Design-System)) ilk çalışır hâle getirecek teknik runbook. Brand kararları Brand Guideline'da yaşıyor, kod tarafı henüz token'ları tüketmiyor; bu doc o ikisinin arasındaki katmanı tanımlar.

Bu doc kanonik referans **rationale** değil — Brand-decision rationale'ı `.claude/skills/brand-design/SKILL.md` ve Brand Guideline Figma dosyasındadır. Burada **nasıl bootstrap'lenir** ve **dosya yapısı ne olmalı** sorularına cevap veriyoruz.

## Yapı genel bakış

Üç Figma dosyası, tek yönlü akış:

```
Brand Guideline   →   Design System   →   Components / Screens / Code
(decisions)           (this doc)           (consumers)
```

Untitled UI ([cDLzPUkcsDJtvwqZLWRwrd/UntitledUI](https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/UntitledUI)) Design System'in **kaynak materyali** — primitive'leri oradan **detach + re-skin** ederek Glaon Semantic variable'larına bağlıyoruz. Untitled UI kendisi consumer'lar tarafından doğrudan referans edilmez.

## Sayfa yapısı

Design System dosyası şu altı sayfayı, bu sırayla içerir:

| Sayfa           | İçerik                                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cover**       | Dosyanın rolü, sahibi, library publish durumu, Brand Guideline + Untitled UI dosyalarına link, Untitled UI lisans/attribution paragrafı, "nasıl tüketilir" not.                                                                          |
| **Variables**   | `Primitives` ve `Semantic` koleksiyonlarının kanonik gösterimi (swatch'ler, scale tabloları). Variables Figma'nın sol panelinde yaşar; bu sayfa görsel referans + dokümantasyondur.                                                      |
| **Foundations** | Text styles (Display/Heading/Body/Caption × Web/RN), spacing/radii/shadow scale örnekleri, color usage do/don't.                                                                                                                         |
| **Components**  | Detach edilmiş + re-skin edilmiş primitive'ler. Her primitive bir frame; variants/sizes/states matrisi yan yana. Component description'ında `storybook-id: <kebab-case>` zorunlu.                                                        |
| **Patterns**    | Birden çok primitive'in birlikte kullanıldığı kabul edilmiş örüntüler (form layout, card hierarchy, modal flow). Composite component değil — örnek, "böyle birleştirilebilir" demonstrasyonu. Composite'lar Components Figma dosyasında. |
| **Changelog**   | Library publish'leri arası yapılan değişikliklerin manuel kaydı (Figma henüz bunu otomatikleştirmiyor). Her publish'te bir frame: tarih, değişen Variables/styles/components listesi, breaking change uyarısı.                           |

## Variables — koleksiyonlar ve modes

İki koleksiyon, iki mode ekseni:

### Koleksiyonlar

- **Primitives** — Brand Guideline'daki ham değerlerin Design System'deki yansıması. `color/sand/100`, `color/night-blue/500`, `space/4`, `radius/md`, `shadow/card` gibi. Brand Guideline kısmen dolu olduğu sürece bazı primitive'ler de eksik kalır; eksikler `null` veya placeholder olarak işaretlenir.
- **Semantic** — Components'in tükettiği isimler. `surface/default`, `text/primary` vb. Her semantic variable bir primitive'e (ya da ileride: başka bir semantic'e) bind'lenir.

### Modes

- **Theme**: `light`, `dark`. Dark bindings #140 inene kadar Light primitive'lere fallback.
- **Platform** Figma'da ayrı bir mode değil. Web ile mobile arasındaki farklar (RN spacing multiplier, font stack) **Style Dictionary transform katmanında** uygulanır — Figma sadece base değerleri tutar. Platform-spesifik bir token gerçekten gerekirse (örn. `font/family/web` vs. `font/family/rn`) bunu mode yerine variable name'inde kodlarız.

### Semantic taksonomi

Bu liste sabittir; yeni semantic eklemek için Brand-decision issue gerekir (#137 / #138 / #139 örnekleri). İlk slice'ta tanımlananlar:

| Grup      | Variable                                             | Örnek Light binding (Brand Guideline ilerledikçe doğrulanır) |
| --------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| `surface` | `surface/default`, `surface/muted`, `surface/raised` | Kirli Beyaz, Kirli Beyaz tint, beyaz veya alpha (#139)       |
| `text`    | `text/primary`, `text/muted`, `text/inverse`         | Night Blue, Night Blue 60%, Kirli Beyaz                      |
| `border`  | `border/subtle`, `border/strong`                     | Sand line, Night Blue 20%                                    |
| `brand`   | `brand/primary`, `brand/hover`, `brand/pressed`      | Brand primary; hover/pressed #138 ile karara bağlanır        |
| `state`   | `state/success`, `state/warning`, `state/danger`     | Brand palette içinden; danger #137 ile karara bağlanır       |

Eksik kalanlar (`brand/hover`, `brand/pressed`, `state/danger`, `surface/raised`) Brand-decision issue'ları kapanana kadar Light primitive'e geçici fallback ile bind'lenir. Semantic _isimleri_ değişmez — yalnız değerler güncellenir.

## Untitled UI: detach + re-skin

Karar: **detach + re-skin** (subscribe ya da reference değil).

### Akış

1. **Kopyala**: Untitled UI dosyasında ihtiyacımız olan primitive'i seç → Cmd/Ctrl+C → Design System Components sayfasına yapıştır.
2. **Detach**: Yapıştırılan instance'ı `Detach instance` ile master link'inden ayır. Artık yerel component'tir; Untitled UI'nin sonraki güncellemelerinden bağımsız.
3. **Re-skin**: Plugin script (#147 pattern'i) fill/stroke/text bağlamalarını Glaon `Semantic` variable'larına yeniden bağlar. Hard-coded renk kalmaz; raw spacing/sayılar Glaon `Primitives` üzerinden ifade edilir.
4. **Variants doğrula**: `intent / size / state` matrisi Components sayfasına serilir. Eksik state varsa o primitive'in issue'sında not düşülür.
5. **Tag'le**: Component description'a `storybook-id: web-primitives-<name>` ekle. Chromatic Figma plugin'i (#53) bu etiketi okuyor.
6. **Publish**: Library publish manuel adım. Variables → Publish; Components → Publish. Kullanıcı tetikler.

### Lisans / attribution

Untitled UI ücretli bir kit; lisans koşulları her publish'te Cover sayfasında atıf paragrafıyla taşınır. Re-skin'in lisans gereksinimini karşıladığından emin olmak Glaon ekibinin sorumluluğunda; ilk publish öncesi lisans paragrafının doldurulmuş olması zorunlu (placeholder ile başlanır, ilk publish'te tamamlanır).

## Plugin script çalıştırma akışı

Tüm bootstrap operasyonları `tools/figma-plugin/scripts/` altında commit edilir. Per-task akış (bkz. `tools/figma-plugin/README.md`):

1. Çalıştırmak istediğin script'i seç (`01-variables-bootstrap.js`, `02-text-styles.js`, `03-button-import-reskin.js`).
2. İçeriğini `tools/figma-plugin/code.js`'in üzerine yapıştır.
3. Figma desktop'ta dosyayı aç → Plugins → Development → Glaon → çalıştır.
4. **Dry-run (default)**: `CONFIRM = false` ile script ne yapacağının özetini `figma.notify` üzerinden gösterir, mutasyon yapmaz.
5. Özeti onayladıysan script'in başındaki `CONFIRM = true` flag'ini aç → tekrar çalıştır.
6. Figma'da değişiklikleri review et (Variables panel, Components sayfası).
7. Memnunsan library'i publish et. Değilsen `Ctrl+Z` ile geri al.
8. `code.js`'i scaffold haline döndür: `git restore tools/figma-plugin/code.js`.

Idempotent olduğu için her script tekrar çalıştırılabilir — eksik mode/variable ekler, var olanı yeniden yaratmaz. Brand Guideline ilerledikçe `01-variables-bootstrap.js` yeniden çalıştırılır; eski değerler korunur, yenileri yamalanır.

## storybook-id format

Her customize edilen primitive'in component description'ında:

```
storybook-id: web-primitives-<kebab-case>
```

Format: Storybook CSF path'inin kebab-case çevirisi. Örnekler:

| Primitive                       | storybook-id                     |
| ------------------------------- | -------------------------------- |
| `Web Primitives/Button`         | `web-primitives-button`          |
| `Web Primitives/Input`          | `web-primitives-input`           |
| `Web Primitives/Card`           | `web-primitives-card`            |
| `RN Primitives/PressableButton` | `rn-primitives-pressable-button` |

Detay: [docs/figma.md — Component description → Storybook ID](figma.md#component-description--storybook-id).

## Sonra ne var?

Bu doc bittiğinde sıra:

1. **Foundation issue'ları** kapanır: #144 (file scaffold), #145 (Variables), #146 (typography).
2. **Button issue'su** (#147) end-to-end pattern'i kurar.
3. **Follow-up primitive grupları** (#148–#152) Button pattern'ini kopyalar.
4. **Library publish edilir** → Components / Screens dosyaları subscribe edebilir.
5. **Token JSON export** (deferred — `docs/figma.md` follow-ups) — design tokens kod tarafına bağlanır.
6. **Phase-3 kod consumer'ları** başlar (#14, #15, #17).

## Referanslar

- Brand-decision skill: [.claude/skills/brand-design/SKILL.md](../.claude/skills/brand-design/SKILL.md)
- Figma file ladder + naming + token akışı: [docs/figma.md](figma.md)
- Plugin contract (guardrails): [tools/figma-plugin/README.md](../tools/figma-plugin/README.md)
- Chromatic Figma plugin entegrasyonu: [docs/chromatic.md](chromatic.md#figma-entegrasyonu)
- Brand-decision issue'ları: #132 (color), #133 (type), #134 (spacing/radii/shadow), #137 (state/danger), #138 (brand/hover-pressed), #139 (surface/raised), #140 (dark mode).
- Design-system foundation issue'ları: #142, #143, #144, #145, #146, #147; follow-up primitive grupları: #148–#152.
