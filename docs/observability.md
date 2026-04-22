# Observability — Sentry entegrasyonu

Glaon çalışma zamanı hatalarını ve performans sinyallerini **Sentry** üzerinden toplar. Web ve mobile aynı PII politikasını paylaşır; SDK importu platform-spesifik.

## Mimari

Üç katman var:

| Katman                             | Ne yapar                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `@glaon/core/observability`        | Platform-bağımsız tipler + PII scrubber. DOM/RN import etmez. Web ve mobile aynı scrubber'ı paylaşır.                  |
| `apps/web/src/observability.ts`    | `@sentry/browser` SDK'sını runtime'da init eder; core'dan gelen `buildBeforeSend`'i `Sentry.init`'e verir.             |
| `apps/mobile/src/observability.ts` | `@sentry/react-native` SDK'sını init eder; aynı core scrubber'ı `beforeSend`'e bağlar. Expo config plugin ile wire'lı. |

Core, **politika** (ne maskelenir, hangi anahtar hassas) ve **saf fonksiyonlar** (scrub) tutar. SDK importu ve init, uygulama katmanında. Bu sayede mobile bundle DOM-only `@sentry/browser`'ı çekmez; web bundle RN-only `@sentry/react-native`'i çekmez.

## Scrubber ne maskeler

`buildBeforeSend()` her event için şu işlemleri yapar (kaynak: [packages/core/src/observability/scrubber.ts](../packages/core/src/observability/scrubber.ts)):

- **URL query param'ları** — `access_token`, `refresh_token`, `id_token`, `token`, `code`, `state`, `client_secret`, `api_key`. OAuth2 callback URL'lerinin Sentry'ye sızmasını engeller.
- **Header'lar** — `Authorization`, `Cookie`, `Set-Cookie`, `X-Auth-Token`, `X-Hasura-Admin-Secret` (case-insensitive).
- **Objede anahtar adı geçen alanlar** (recursive) — anahtar adı `access_token`, `refresh_token`, `id_token`, `bearer`, `password`, `secret`, `api_key`, `client_secret`, `authorization` substring'lerinden birini içeriyorsa değer `[Filtered]` ile değiştirilir.
- **Request cookie** — direkt `[Filtered]`.
- **Breadcrumb `data.url` ve `data.query_string`** — URL scrubber'ından geçer. `breadcrumb.message` serbest metin kabul edilir, dokunulmaz (URL'ler breadcrumb.data.url altında taşınır).

Scrubber non-mutating (girdi objesini değiştirmez) ve `MAX_SCRUB_DEPTH = 8` ile sonsuz dallanmayı keser. Davranışsal kontrat [scrubber.test.ts](../packages/core/src/observability/scrubber.test.ts) içindeki 16 test ile donmuş — politikayı değiştirirken test de güncellenir.

Yeni bir hassas alan eklemek için `SENSITIVE_URL_PARAMS`, `SENSITIVE_HEADER_NAMES` veya `SENSITIVE_KEY_SUBSTRINGS` listelerine ekle ve ilgili test case'i ekle. Kod değişmeden.

## Web — konfigürasyon

### Environment variables

`apps/web/.env.example` içinde hepsi dokümante:

| Değişken                  | Zorunlu                | Açıklama                                                                                    |
| ------------------------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| `VITE_SENTRY_DSN`         | Prod build'te **evet** | Sentry project DSN'i. Yoksa prod build başarısız (vite.config.ts gate'i). Dev'de opsiyonel. |
| `VITE_SENTRY_ENVIRONMENT` | Hayır                  | Override environment tag. Boşsa Vite `mode` kullanılır.                                     |
| `VITE_SENTRY_RELEASE`     | Hayır                  | Release identifier (genelde git SHA veya paket versiyonu).                                  |
| `SENTRY_AUTH_TOKEN`       | Source map upload için | Build-time only. CI'da secret; lokalde genelde boş.                                         |
| `SENTRY_ORG`              | Source map upload için | Sentry organizasyon slug'ı.                                                                 |
| `SENTRY_PROJECT`          | Source map upload için | Sentry proje slug'ı.                                                                        |

Üçü (`AUTH_TOKEN`, `ORG`, `PROJECT`) aynı anda set edildiğinde `@sentry/vite-plugin` build sırasında source map'leri yükler ve dist'ten silmez — release'e bağlanır. Aksi durumda plugin devreye girmez.

### Prod build gate

[apps/web/vite.config.ts](../apps/web/vite.config.ts) production build'lerde (`command === 'build' && mode === 'production'`) `VITE_SENTRY_DSN` yoksa hata fırlatır. Amaç: DSN'siz prod artifact deploy etme olasılığını CI-time'da kapatmak. `vite preview` ve dev server gate'i tetiklemez — preview zaten önceden üretilmiş dist'i servis eder, yeni artifact üretmez.

Bu gate CI'daki E2E workflow'unu etkiler — [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) Build web app adımında placeholder bir DSN (`https://public@sentry.invalid/0`) set eder. Event'ler hiçbir yere gitmez; E2E zaten Sentry trafiğine assert etmez.

### Runtime init

[apps/web/src/main.tsx](../apps/web/src/main.tsx), render'dan önce `initObservability()` çağırır. DSN yoksa:

- **Prod bundle'da** — `console.error` ile bağırır ama crash etmez. Build gate'i bypass'lanmış bir artifact'ı tespit etmek için sessiz fallback.
- **Dev'de** — `console.info` ile sessizce kapanır.

DSN varsa `Sentry.init` çağrılır: `tracesSampleRate` prod'da 0.1, dev'de 1.0; `sendDefaultPii: false`; `beforeSend` core scrubber'ı.

## Mobile — konfigürasyon

### Expo config plugin

`@sentry/react-native` [apps/mobile/app.json](../apps/mobile/app.json)'da plugin olarak kayıtlı (`"@sentry/react-native/expo"`). `eas build` native modülü otomatik bağlar; ek Podfile / gradle müdahalesi yok. Bare workflow'a geçilirse plugin yerine elle config gerekir.

### Environment variables

`apps/mobile/.env.example` içinde dokümante. `EXPO_PUBLIC_` prefix'li değişkenler Metro bundle'ına inline edilir — DSN böylece runtime'da `process.env`'den okunur.

| Değişken                         | Zorunlu             | Açıklama                                                           |
| -------------------------------- | ------------------- | ------------------------------------------------------------------ |
| `EXPO_PUBLIC_SENTRY_DSN`         | Prod EAS build için | DSN yoksa prod bundle'da loud `console.error`, dev'de sessiz warn. |
| `EXPO_PUBLIC_SENTRY_ENVIRONMENT` | Hayır               | Override environment tag. Boşsa `__DEV__` üzerinden türetilir.     |
| `EXPO_PUBLIC_SENTRY_RELEASE`     | Hayır               | Release identifier (genelde git SHA veya app version).             |

Source map upload (mobile) bu PR'ın kapsamında değil — EAS build pipeline'ı (#36) ile birlikte açılacak. O zaman `SENTRY_AUTH_TOKEN` + org/project slug'ları EAS secret olarak inject edilir.

### Prod build gate

Mobile'da web'deki gibi build-time DSN gate'i **yok**. Mantıken karşılığı EAS build step'inde çalışacak bir script — #36'nın kapsamı. Şu an için prod bundle'da DSN eksikse `initObservability` `console.error` basar, çalışmaya devam eder.

### Runtime init

[apps/mobile/App.tsx](../apps/mobile/App.tsx) ilk render'dan önce `initObservability()` çağırır. DSN yoksa:

- **Prod bundle'da** — `console.error` ile bağırır; crash etmez.
- **Dev'de (`__DEV__`)** — `console.warn` ile sessizce kapanır.

DSN varsa `Sentry.init` çağrılır: `tracesSampleRate` prod'da 0.1, dev'de 1.0; `sendDefaultPii: false`; `beforeSend` core scrubber'ı — web ile aynı politika.

## Yeni breadcrumb veya custom event eklemek

SDK doğrudan platform adapter'ında import'lanır; bileşen kodu Sentry'yi bilmek zorunda değil. İhtiyaç olduğunda:

```ts
// apps/web için
import * as Sentry from '@sentry/browser';
// apps/mobile için
// import * as Sentry from '@sentry/react-native';

Sentry.addBreadcrumb({
  category: 'ha.ws',
  message: 'websocket reconnect attempt',
  level: 'info',
  data: { url: wsUrl, attempt: retryCount },
});
```

`data.url` otomatik olarak URL scrubber'ından geçer — elle temizlemeye gerek yok.

`Sentry.captureException(err)` benzer şekilde, core politika beforeSend'te devreye girer.

## Manuel doğrulama

Lokal prod build DSN olmadan:

```bash
pnpm --filter @glaon/web build
# Error: [glaon/web] VITE_SENTRY_DSN is required for production builds. ...
```

Placeholder DSN ile:

```bash
VITE_SENTRY_DSN=https://public@sentry.invalid/0 pnpm --filter @glaon/web build
# Build geçer, source map plugin devreye girmez (AUTH_TOKEN boş).
```

Core test'i:

```bash
pnpm --filter @glaon/core test
```

## Kullanıcı tarafı — merge sonrası adımlar

Kod iskeleti tamam; gerçek event akışı için repo-dışı konfigürasyon gerekiyor:

1. **Sentry projeleri oluştur** — `sentry.io`'da iki ayrı proje aç: biri `glaon-web` (React), biri `glaon-mobile` (React Native). Her ikisinden DSN'i kopyala.
2. **Web için repo secret'ları ekle** — GitHub repo → Settings → Secrets → Actions:
   - `SENTRY_DSN_WEB` (deploy workflow'unda `VITE_SENTRY_DSN` olarak inject edilir)
   - `SENTRY_AUTH_TOKEN` — Sentry → User Auth Tokens, `project:releases` + `project:write` scope'ları ile
   - `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG_WEB`
3. **Mobile için EAS secret'ları ekle** — `eas secret:create` ile:
   - `EXPO_PUBLIC_SENTRY_DSN` — `glaon-mobile` projesinin DSN'i
   - Source map upload secret'ları (#36 ile birlikte): `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG_MOBILE`
4. **Deploy workflow'unu güncelle** — HA Add-on deploy akışı (#70) açıldığında web secret'ları build step'ine verilir. E2E workflow'undaki placeholder DSN burada gerçek DSN ile değişir.
5. **EAS build profilinde source map upload'u aç** (#36) — `@sentry/react-native/expo` plugin'i native modülü wire eder, fakat source map upload ayrı `expo-router` script adımı gerektirir; #36 bunu EAS config'e ekleyecek.
6. **PII scrubber doğrulaması** — Prod trafiği başladıktan sonra Sentry UI'da ilk birkaç event'i gözden geçir; query string, header, body alanlarında token/secret kalmadığını doğrula. Yeni bir sızıntı tespit edilirse `SENSITIVE_*` listelerine ekle (tek yerden her iki platformu da etkiler).

## Neden SDK core'da değil

`@glaon/core` hem web (Vite/React) hem mobile (Expo/RN) tarafından import edilir. `@sentry/browser` DOM API'lerine (`window`, `document`, `XMLHttpRequest`) dayanır; RN bundle'ına sokulursa runtime'da patlar. Mobile tarafı ayrı bir SDK (`@sentry/react-native`) kullanır. Core sadece politika + scrubber tutarak her iki tarafın SDK'sına aynı `beforeSend`'i pas etmeyi mümkün kılar.
