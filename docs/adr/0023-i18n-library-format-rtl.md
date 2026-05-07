# ADR 0023 — i18n library + file format + RTL strategy

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-07
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue [#407](https://github.com/toss-cengiz/glaon/issues/407) (this ADR), epic issue [#406](https://github.com/toss-cengiz/glaon/issues/406) (i18n + localization), [ADR 0004 — `@glaon/core` platform-agnostic](0004-glaon-core-platform-agnostic.md), [ADR 0011 — Untitled UI React kit](0011-untitled-ui-react-kit.md), [ADR 0013 — Tailwind v4 + UUI theme](0013-tailwind-v4-uui-theme.md), [ADR 0008 — Chromatic visual regression](0008-chromatic-visual-regression.md)

## Bağlam

Glaon Türkçe + İngilizce desteğini Phase 2'den itibaren ürünleştirecek. Şu an `apps/web` + `apps/mobile` + `@glaon/ui` içinde **hiçbir i18n altyapısı yok** — string'ler hardcoded olarak component'lere veya feature dosyalarına gömülü. Bu ADR i18n stack'inin üç temel kararını kilitler — kütüphane, dosya formatı, RTL stratejisi — yerleşik bir kod runtime'i landing'inden önce.

[Epic #406](https://github.com/toss-cengiz/glaon/issues/406) i18n kapsamını detaylandırdı: çok-paket dokunuş (`@glaon/ui` primitive surface'ları, `@glaon/core` HA WS dil hint'i, `apps/web` + `apps/mobile` provider + switcher UI, `apps/api` per-user locale persistence), HA'nın `frontend/get_translations`'ı tüketme zorunluluğu, runtime locale switch + persistence. Bu ADR kapsamı **yalnız 1+2+5 numaralı açık karar noktaları** ile sınırlı (epic'in i18n-A sub-issue'su):

1. Hangi kütüphane?
2. Hangi dosya formatı?
3. RTL V1 mi V2 mi?

Diğer kararlar ayrı sub-issue'lara dağılıyor (i18n-B/C/D/E/F/G/H/I); HA translations merge stratejisi i18n-D'ye, locale persistence i18n-C'ye ait.

Tartışma çerçevesi:

- **Web + React Native compat:** Tek kütüphane iki platformda da çalışmalı. Web-only veya RN-only çözümler dışlanır (paket boundary ihlali, ADR 0004).
- **ICU MessageFormat:** Çoğullaştırma (`{count, plural, ...}`), cinsiyet, ordinal, seçim mantığı (`{gender, select, male {...}}`) Glaon'un kullanıcı yüzüyle ilgili kısmında zorunlu — TR çoğul ile EN çoğul kuralları farklı (TR'de 0 plural, 1 singular, 2+ singular; EN'de 1 singular, 2+ plural).
- **Bundle size:** Web app FCP/LCP hassasiyeti; runtime kütüphane + locale catalog'unun toplamı kritik. Mobile için bundle splitting opsiyonu olmalı.
- **Storybook integration:** [Storybook Rule (CLAUDE.md)](../../CLAUDE.md#storybook-rule-mandatory) component her PR'da story ile ships; locale switcher decorator gerekirse maintenance maliyeti olur.
- **HA bridge fizibilitesi:** [`frontend/get_translations`](https://developers.home-assistant.io/docs/api/websocket/) HA'dan dil-spesifik device class label'larını döner. Glaon bu çıktıyı namespace'leyip merge edecek (i18n-D ADR'inde detaylanacak); kütüphane bu merge'i kolaylaştırmalı.
- **TypeScript:** Translation key'ler için type-safety isteği (`t('button.cancel')` typo'sunu compile-time'da yakalama).

Göz önünde bulundurulan alternatifler:

| Boyut                  | react-i18next + i18next-icu                            | FormatJS (`react-intl`)              | Lingui                             | Hand-rolled                       |
| ---------------------- | ------------------------------------------------------ | ------------------------------------ | ---------------------------------- | --------------------------------- |
| Web + RN compat        | ✅ ikisi de                                            | ✅ ikisi de                          | ✅ ikisi de                        | ✅ runtime'sız                    |
| ICU MessageFormat      | ✅ plugin (i18next-icu)                                | ✅ native                            | ✅ native                          | ❌ kendi yazılır                  |
| Bundle size (runtime)  | ~35 KB (i18next + react-i18next)                       | ~30 KB                               | ~5-10 KB (compile-time extracted)  | ~0 KB ama plural cost runtime'da  |
| Async catalog loading  | ✅ native (backend plugin)                             | ⚠ manuel (`addMessages`)             | ⚠ manuel (`activate`)              | ❌ tasarımdan yok                 |
| Storybook integration  | ✅ resmi addon (storybook-addon-i18n + i18next plugin) | ⚠ custom decorator                   | ⚠ custom decorator                 | ⚠ custom                          |
| TypeScript types       | ✅ resource type generation                            | ✅ ICU types via cli                 | ✅ compile-time inference (en iyi) | ⚠ kendi yazılır                   |
| Ecosystem maturity     | En yüksek                                              | Yüksek (FormatJS lib)                | Orta, büyüyor                      | —                                 |
| HA translations bridge | ✅ namespace + backend plugin pattern                  | ⚠ kendi merge                        | ⚠ kendi merge                      | ⚠ kendi merge                     |
| Karar                  | **Seçilen**                                            | Reddedildi (Storybook + bridge work) | Reddedildi (adoption riski)        | Reddedildi (kapsam dışı reinvent) |

Reddedilme gerekçeleri:

- **FormatJS** ICU MessageFormat yerleşik, en saf ICU çözümü. Reddedildi çünkü: (a) Storybook için resmi i18n addon'u yok, custom decorator + her component için story'ler arası locale persistence custom code; (b) HA translations bridge için "backend plugin" tarzı abstraction yok — her HA reconnect'te manuel `intl.update()` + cache invalidation kendi kodumuzda. Bu iş react-i18next'te çoktan çözülmüş.
- **Lingui** en küçük runtime + en iyi TypeScript inference. Reddedildi çünkü: (a) React'in olmazsa olmaz mainstream'i değil; küçük bir community + ileride maintainer çıkmama riski; (b) compile-time extraction Vite + Expo build'lerine ek babel plugin + macro setup gerektiriyor — Phase 2'de zaten Tailwind v4 + UUI + Storybook + Chromatic kompozisyonu var, ek build complexity istemem.
- **Hand-rolled** sadece basit lookup için makul. Reddedildi çünkü: TR plural kuralları (`few`, `many`, `other` — CLDR'a göre TR yalnız `other`'ı kullanır ama yine de plural rule resolver lazım), gender, format negotiation, locale fallback chain (`tr-TR` → `tr` → `en`), Intl native API'leri ile orchestration — her birini kendi yazmak weeks of work, value yok.

## Karar

**Glaon i18n stack'i `react-i18next` (i18next çekirdeği + `i18next-icu` plugin'i) üstünde, ICU JSON dosya formatıyla, V1 LTR-only stratejiyle kuruluyor.**

### Library pick: react-i18next + i18next-icu

```
┌─────────────────────────────────────────────────────────────┐
│ apps/web (Vite)         apps/mobile (Expo)                  │
│ - i18next instance      - i18next instance                  │
│ - react-i18next hooks   - react-i18next hooks               │
│ - LanguageDetector      - LanguageDetector (expo-localization)│
│ - HttpBackend (lazy)    - resources bundled at build time   │
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ packages/core/src/i18n/ (shared, platform-agnostic)         │
│ - createI18nInstance() factory                              │
│ - HA translations bridge (i18n-D)                           │
│ - LocaleNegotiator (precedence chain logic)                 │
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ packages/ui/src/i18n/ (component-facing)                    │
│ - Translatable primitive surfaces (placeholder, aria-label) │
│ - Storybook decorator (storybook-react-i18next)             │
└─────────────────────────────────────────────────────────────┘
```

**Paket sınırları:**

- **`@glaon/core/i18n/`** — i18next instance factory, HA translations bridge, locale negotiator. Platform-agnostic ([ADR 0004](0004-glaon-core-platform-agnostic.md) invariant'i): no DOM, no `react-native`, no `expo-localization` direct import. Browser/Node-friendly.
- **`apps/web/i18n.ts`** — instantiate i18next with `i18next-http-backend` (lazy locale loading from `/locales/<lng>/<ns>.json`), `i18next-browser-languagedetector` (precedence: explicit user setting → HA user profile language → browser navigator → fallback `en`).
- **`apps/mobile/i18n.ts`** — instantiate i18next with bundled resources (no http backend; Expo bundle size kabul edilebilir, network-free first launch zorunlu) + `expo-localization`-based detector.
- **`packages/ui/src/i18n/`** — translatable primitive default'ları (`Modal` close button aria-label, `Input` placeholder default, vs.) `@glaon/ui` namespace'inde. UI components'in stories'i `storybook-react-i18next` decorator ile locale switcher'a katılır.

**Plugin compose:**

- `i18next` çekirdek
- `react-i18next` (hook + provider)
- `i18next-icu` (ICU MessageFormat)
- `i18next-http-backend` (web only, lazy load)
- `i18next-browser-languagedetector` (web only)
- `expo-localization` (mobile only)

### File format: ICU JSON, namespaced

**Dosya yerleşimi:**

```
locales/
├── en/
│   ├── ui.json            # @glaon/ui primitive defaults
│   ├── web.json           # apps/web feature copy
│   ├── mobile.json        # apps/mobile feature copy
│   └── ha.json            # HA translations cached (auto-populated, gitignored)
└── tr/
    ├── ui.json
    ├── web.json
    ├── mobile.json
    └── ha.json
```

**Format özellikleri:**

- **Flat-with-dotted-keys** anahtar yapısı: `"button.cancel": "İptal"`. Nested object yerine flat key — translator UI'larında (Crowdin, Lokalise) flat liste daha okunaklı; i18next yine de namespace ayrımını destekler.
- **ICU MessageFormat** inline:
  ```json
  {
    "device.count": "{count, plural, =0 {Cihaz yok} other {{count} cihaz}}",
    "user.greeting": "Merhaba {name, select, male {Sayın {name}} female {Sayın {name}} other {Merhaba {name}}}"
  }
  ```
- **Türkçe plural rules** CLDR'a göre yalnız `other` form'u var (TR plural sade) — i18next-icu ICU runtime'ı bunu otomatik çözer; key tanımında `{count, plural, other {...}}` yeterli.
- **Namespace ayrımı:** `ui`, `web`, `mobile`, `ha`. `t('ui:button.cancel')` veya namespace'i provider'da default'la set ederek `t('button.cancel')`.
- **HA namespace:** `ha.json` HA `frontend/get_translations` çıktısını cache'ler. Kullanıcı HA'ya bağlandığında i18n-D logic'i tarafından doldurulur; `.gitignore`'da. Local dev için sample `ha.example.json` repo'da olur.

**Neden ICU JSON, .po değil:**

- `.po` (gettext) Linux/native masaüstü ekosistemi — modern web/RN tooling daha yetersiz, build adımı ekstra (`po2json`).
- ICU JSON i18next-icu native; Crowdin/Lokalise/POEditor doğrudan tüketir.
- JSON git diff insanlar için okunabilir; merge conflict çözümü kolay.

### RTL strategy: V1 LTR-only, V2 RTL audit

- **V1 (Phase 2):** LTR-only. `<html dir="ltr">` (sabit), Tailwind `start-*` / `end-*` logical utilities **opsiyonel** (zaten kullanan component'ler kalır; yeni eklemeler `left-*` kullanabilir). Hedef diller: `en`, `tr` — ikisi de LTR.
- **V2 (Phase 3+):** RTL audit. `dir="rtl"` test edildiğinde:
  - Tailwind v4 logical utilities migration (`ms-*`, `me-*`, `start-*`, `end-*`) — UUI component'lerinde bazı yerlerde `pl-*` / `pr-*` kalmış olabilir, bunlar logical'a evrilir.
  - `text-align: start | end` (vs `left | right`).
  - Icon mirroring (chevron'lar, geri butonu — `transform: scaleX(-1)` veya RTL icon variant'ı).
  - Storybook'a `dir="rtl"` decorator eklenir; Chromatic baseline RTL için ek snapshot.
  - HA RTL behavior testi (Arapça HA instance üzerinde `frontend/get_translations`).
- **V2 trigger:** İlk RTL dil talebi (Arapça `ar`, İbranice `he`, Farsça `fa`) — community veya stakeholder'dan somut request. Phase 2 v0 önceliğinde değil.
- **Tasarım disiplini:** Yeni component'ler eklenirken **tercih edilen** logical utility kullanımı; yine de zorunlu değil — V2'de toplu audit + Tailwind codemod.

## Sonuçlar

### Olumlu

- **Mature ecosystem:** `react-i18next` React i18n için de facto standart; bug ve question'lar Stack Overflow'da çözülmüş, contributor pool geniş, breaking change frequency düşük.
- **Plugin compose:** ICU support, async loading, language detection, Storybook integration — hepsi `i18next-*` plugin'leri olarak compose edilir; tek vendor surface.
- **HA bridge clean fit:** `i18next` `addResources(lang, 'ha', haTranslations)` API'si HA `frontend/get_translations` çıktısını runtime'da inject etmeye uygun; reconnect'te `removeResourceBundle` + tekrar `addResources` (i18n-D'de detaylanacak).
- **Storybook native:** `storybook-react-i18next` addon locale switcher'ı toolbar'a koyar, her story locale'a göre re-render. Story authoring için ek work yok.
- **Bundle size kabul edilebilir:** ~35KB runtime (gzipped) `apps/web` first load için kabul edilebilir; lazy locale loading ile ilk locale catalog'u (~10-20KB) split edilir.
- **TR plural sade:** ICU yalnız `other` formuyla TR'de kolay yazılır; format hatasını runtime'da yakalar.
- **V1 LTR-only sınırı net:** RTL audit work'ünü Phase 3'e ertelemek Phase 2 throughput'unu korur; "hangi component'te `pl-4` var?" gibi rabbit hole'lara girmeyiz.

### Olumsuz / ödenecek bedel

- **Bundle size i18next hala ~35KB:** Lingui'nin ~5-10KB runtime'ına göre büyük. Web FCP/LCP'ye bakacaksak ileride trigger.
- **Storybook addon dependency:** `storybook-react-i18next` 3rd-party (community-maintained); Storybook major bump'larında uyumsuzluk riski. Mitigasyon: Renovate normal akışı + breaking change'lerde kendi decorator yazımı kolay (~30 satır).
- **i18next-icu ekstra plugin:** Native ICU yerine plugin layer. Çok büyük cost değil ama "ICU yazıyorum, neden ekstra plugin?" sorusunun cevabı dokumented olmalı. (Cevap: i18next core'u ICU'yu doğrudan parse etmiyor; ICU support için plugin pattern'i.)
- **HA namespace cache invalidation:** HA reconnect'te `ha.json` cache invalidate + reload edilmeli. Manuel logic (i18n-D'de yazılacak); race condition riski var (yeni HA resource yüklenmeden component re-render).
- **V1 LTR'lik kabul:** RTL kullanıcısı (Arapça, İbranice komşu pazarlar) Phase 2'de Glaon'u boş ekran benzer görürken kullanamayacak. Phase 3'e kadar sınır kabul edildi.
- **TypeScript inference orta:** Lingui'nin compile-time key inference'ı yok; i18next type generation `i18next-resources-for-ts` ile ekstra build step. Phase 2 v0'da bu opsiyonel.

### Etkileri

- **i18n-B (foundation issue):** `apps/web/i18n.ts`, `apps/mobile/i18n.ts`, `packages/core/src/i18n/`, `packages/ui/src/i18n/`, `/locales/en/*.json` + `/locales/tr/*.json` skeleton'ları, ESLint kuralı (yeni hardcoded user-visible string ban).
- **i18n-G (Storybook docs):** `storybook-react-i18next` addon konfigürasyonu, `Foundations / i18n` MDX page'i.
- **i18n-D (HA bridge):** i18next `ha` namespace'inde `addResources` pattern'i; reconnect lifecycle; sample `ha.example.json`.
- **i18n-C (storage):** `apps/api`'a `user.locale` field'ı (#392 P2-D + P2-F sonrası). i18next-localstorage cache (web) + AsyncStorage (mobile) intermediate olarak Phase 2 v0'da kabul edilebilir; cloud-side persistence i18n-C'de.
- **i18n-H (CI gate):** Missing key check — i18next `saveMissing` mode test'te aktif; CI'da hata.
- **`@glaon/ui` primitive surface:** Aria-label, placeholder, format function'ları için inline default + override prop'u (`<Modal closeLabel={t('ui:button.close')} />`). i18n-B + her primitive update.
- **Bundle size monitoring:** `apps/web` size-check workflow'una i18next + locale catalog'u dahil; baseline güncellenir.
- **Renovate scope:** `i18next`, `react-i18next`, `i18next-icu`, `i18next-http-backend`, `i18next-browser-languagedetector`, `expo-localization`, `storybook-react-i18next` Renovate'in normal akışında; major bump'lar manuel review.
- **CSP `connect-src`:** Web `apps/web` `i18next-http-backend` `/locales/...` aynı origin'den fetch eder; CSP eklemesine gerek yok.
- **`docs/CONTRIBUTING.md` (yeni):** "yeni user-visible string nasıl eklenir" rehberi i18n-B/G PR'larıyla gelir.

## Tekrar değerlendirme tetikleyicileri

- **Bundle size FCP'ye zarar:** `apps/web` initial bundle 200KB sınırı (size-check) i18next yüzünden aşılırsa — Lingui'ye migrate'i ROI olarak değerlendir; codemod path zor değil (key'ler aynı format'ta, `t()` API benzer).
- **Lingui ecosystem maturity tipping point:** Lingui 2.0+ Storybook integration native ve production-ready bir RN/Vite story sergilerse — re-evaluate.
- **RTL talebi gelir:** İlk Arapça/İbranice/Farsça user request'i veya stakeholder push'u — RTL audit work issue'u açılır (V2 stratejisi devreye girer).
- **HA translations volume:** HA `frontend/get_translations` çıktısı 100KB+ büyürse — `ha.json` cache stratejisi gözden geçirilir (currently full-load; o zaman lazy / partial load gerekir).
- **Çoğul kuralı complexity:** Yeni dil eklerken (örn. Arapça'nın 6 plural form'u) ICU rule resolver'da edge case bulunursa — ICU MessageFormat doğal olarak halleder, yine de unit-test coverage genişletilir.
- **TypeScript key inference talebi:** "typo'lar compile-time'da yakalanmıyor" şikayeti yoğunlaşırsa — `i18next-resources-for-ts` build step eklenir (yeni ADR gerekmiyor; tooling kararı).

## Referanslar

- Issue [#407 — i18n library + file format + RTL strategy (i18n-A)](https://github.com/toss-cengiz/glaon/issues/407) — bu ADR'in tracking issue'su.
- Epic [#406 — i18n + localization](https://github.com/toss-cengiz/glaon/issues/406) — i18n kapsam ve sub-issue ağacı.
- [ADR 0004 — `@glaon/core` platform-agnostic](0004-glaon-core-platform-agnostic.md) — `@glaon/core/i18n/` boundary kuralı.
- [ADR 0011 — Untitled UI React kit](0011-untitled-ui-react-kit.md), [ADR 0013 — Tailwind v4 + UUI theme](0013-tailwind-v4-uui-theme.md) — UI primitive surface, RTL audit Tailwind logical utility geçişi.
- [ADR 0008 — Chromatic visual regression](0008-chromatic-visual-regression.md) — locale story'leri için baseline implications.
- [Storybook Rule (CLAUDE.md)](../../CLAUDE.md#storybook-rule-mandatory) — locale switcher decorator zorunluluğu.
- [Component Data-Fetching Boundary (CLAUDE.md)](../../CLAUDE.md#component-data-fetching-boundary-mandatory) — i18n bundle data; component fetching kuralı korunur (i18next instance feature layer'dan inject edilir, primitive'ler `useTranslation()` kabul eder).
- react-i18next: <https://react.i18next.com/>
- i18next-icu (ICU MessageFormat plugin): <https://github.com/i18next/i18next-icu>
- ICU MessageFormat spec: <https://unicode-org.github.io/icu/userguide/format_parse/messages/>
- CLDR plural rules (TR, EN, AR): <https://cldr.unicode.org/index/cldr-spec/plural-rules>
- HA `frontend/get_translations`: <https://developers.home-assistant.io/docs/api/websocket/#getting-translations>
