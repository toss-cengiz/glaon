# ADR 0004 — `@glaon/core` platform-agnostic paylaşım paketi

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-20
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [CLAUDE.md — Package Boundaries](../../CLAUDE.md#package-boundaries)

## Bağlam

Glaon üç istemci çeşidinden (web, tablet, mobile) aynı Home Assistant örneğine bağlanacak. Paylaşılan mantık:

- OAuth2 PKCE akışı (code verifier/challenge üretimi, token exchange, refresh).
- Home Assistant WebSocket istemcisi (mesaj serileştirme, subscription yönetimi, reconnection).
- Durum yönetiminin platform bağımsız kısmı (entity cache, domain modelleri).
- Yardımcı tipler (HA API şeması, error sınıfları).

Bu mantık her istemcide yeniden yazılırsa:

- Bug fix'ler üç yerde uygulanır; sürüm kayması kaçınılmaz olur.
- Auth güvenliği gibi kritik yolda iki paralel implementasyon = iki paralel saldırı yüzeyi.
- Geliştirici tempo yarıya düşer.

Değerlendirilen yaklaşımlar:

- **`@glaon/core` paketi, platform-agnostic:** Sadece Web Standart API'leri (Fetch, WebSocket, Web Crypto, URL). Web ve React Native 0.71+ zaten bu API'leri sağlıyor. Platform özel kod (`localStorage`, `document`, `expo-secure-store`, `AppRegistry`) girmez.
- **`@glaon/web-core` + `@glaon/mobile-core` (ayrı paketler):** Her platform kendi runtime primitive'ini doğrudan tüketir. Dezavantaj: logic duplikasyonu geri geliyor, yalnızca "tipler" paylaşılıyor. Reddedildi.
- **Tek paket, conditional imports (`react-native` field in package.json):** Metro ve Vite'ın farklı import resolver'ları olmasıyla entropi çok yüksek. Bazı edge case'ler (nested package.json, subpath exports) ile karmaşıklaşıyor. Reddedildi.
- **Tek repo, `@glaon/core` paketi zero-platform-imports:** Platform özel kod (`SecureStore`, `WebBrowser`, DOM) `apps/*` katmanında. Core, platform'a "policy" enjekte ediliyor (dependency injection pattern) — örn. token store için bir `TokenStorage` interface'i tanımlıyor, web ve mobile ayrı implementasyon sağlıyor.

## Karar

**`@glaon/core` platform-agnostic paylaşım paketi olarak kurulur ve package boundary olarak enforce edilir.**

- Kurallar:
  - `window`, `document`, `localStorage` → yasak (web özel).
  - `react-native`, `expo-*` → yasak (mobile özel).
  - İzin verilen runtime API'leri: `fetch`, `WebSocket`, `crypto.subtle`, `URL`, `URLSearchParams`, `TextEncoder`/`TextDecoder`, `AbortController`, `structuredClone`.
  - Tipler, iş kuralları, protokol implementasyonları burada.
  - Platform bağımlı davranış → `apps/web` veya `apps/mobile` interface'i implement ederek enjekte eder.
- ESLint kuralı ile `packages/core/src/**` altında `react-native` veya web global'lerinin import'u engellenir.
- `exports` field iki format yayar: ESM (`./dist/esm/index.js`) + CJS fallback (`./dist/cjs/index.js`) + TypeScript types (`./dist/index.d.ts`). Metro + Vite ikisini de doğru resolve edebiliyor.

## Sonuçlar

### Olumlu

- Auth + WebSocket gibi güvenlik-kritik kod tek yerde — denetim yüzeyi minimum.
- Birim testler platform runtime'ına ihtiyaç duymadan Node üzerinde koşturulabiliyor (Vitest, ADR 0007'den bağımsız olarak test altyapısı hızlı).
- Yeni istemci çeşidi (desktop Electron, CLI) eklersek yeniden yazma minimal.
- TypeScript type-checking mono-repo boyunca tek pipeline — `turbo run type-check`.

### Olumsuz / ödenecek bedel

- Dependency injection pattern boilerplate getiriyor; küçük apilar için ek interface yazmak gerekebilir.
- Platform özgü optimizasyonları core'a sızdırmamaya dikkat etmek gerek — code review disiplini.
- `exports` field dual-format hazard'ı yaratıyor (aynı modülün ESM + CJS yükü çakışırsa); `publint` + `arethetypeswrong` (#97) bunu CI'da yakalıyor.

### Etkileri

- Storybook web preview React Native bileşenlerini `react-native-web-vite` ile tüketmek zorunda kaldı — ama bu `@glaon/ui` paketini etkiler; `@glaon/core`'un kendisi UI bileşeni içermediği için sorun değil.
- CLAUDE.md'de [Package Boundaries](../../CLAUDE.md#package-boundaries) bölümü bu kuralı dayatıyor.

## Tekrar değerlendirme tetikleyicileri

- Web Standart API'lerinin React Native implementasyonu (özellikle Web Crypto) kritik bir bug yaşarsa ve polyfill kabul edilemez maliyette olursa.
- Paylaşım paketi platform özel optimizasyon gerektiren bir darboğaza girerse (kesinlikle profiling ile kanıtlanmalı, önsezi ile değil).

## Referanslar

- [CLAUDE.md — Package Boundaries](../../CLAUDE.md#package-boundaries)
- [Node.js `exports` field spec](https://nodejs.org/api/packages.html#exports)
- [Metro package.json exports support](https://reactnative.dev/blog/2023/06/21/0.72-metro-package-exports-symlinks)
