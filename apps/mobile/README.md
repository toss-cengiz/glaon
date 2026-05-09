# @glaon/mobile

Glaon'un Expo + React Native istemcisi. Local-mode'da Home Assistant'a doğrudan OAuth2 PKCE ile bağlanır; cloud-mode'da Glaon cloud relay'i ([apps/cloud](../cloud/README.md)) üzerinden bağ kurar.

## Geliştirme

```bash
# Bağımlılıklar (monorepo kökünden)
pnpm install

# Expo dev server (mobile workspace içinden)
pnpm --filter @glaon/mobile dev

# iOS simülatöründe aç
pnpm --filter @glaon/mobile ios

# Android emülatöründe aç
pnpm --filter @glaon/mobile android
```

## Ortam değişkenleri

`.env.example`'ı kopyalayıp doldur. Tüm `EXPO_PUBLIC_*` değerleri bundle'a girer (Expo'nun kuralı), sadece public-by-design olanları kullan:

| Değişken                            | Ne işe yarar                                                     |
| ----------------------------------- | ---------------------------------------------------------------- |
| `EXPO_PUBLIC_HA_BASE_URL`           | Home Assistant base URL (cihazdan ulaşılabilir hostname)         |
| `EXPO_PUBLIC_HA_CLIENT_ID`          | OAuth2 client_id (HA'da kayıtlı redirect URI'a karşılık gelmeli) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dev/prod publishable key — set değilse cloud-mode kapalı   |
| `EXPO_PUBLIC_SENTRY_DSN`            | Sentry DSN — dev'de opsiyonel, prod EAS build'inde inject edilir |

## Lokal keşif (`*.local`)

iOS Bonjour `homeassistant.local`'i otomatik resolve eder; Android'de duruma göre çalışır. Glaon kendi mDNS yayınını yapmaz — gerekçe ve istemci matrisi [docs/home-assistant-dev.md → Lokal keşif](../../docs/home-assistant-dev.md#lokal-keşif-local-çözümlemesi) ve [ADR 0024](../../docs/adr/0024-local-discovery-rely-on-ha-hostname.md) altında.

Bonjour resolve etmediğinde mode-select ekranındaki "Enter URL manually" alanı LAN IP'sini kabul eder (`http://192.168.1.50:8123` gibi).

## Native modüller ve Expo prebuild

Bu workspace **managed Expo workflow**'unu hedefler — mevcut Phase 2 kapsamındaki modüller (`expo-secure-store`, `expo-auth-session`, `expo-web-browser`, `expo-crypto`, `@clerk/clerk-expo`) hepsi managed runtime ile uyumlu. `expo prebuild` çalıştırmak gerekmiyor; gerekirse (`react-native-zeroconf` gibi unmanaged native modül eklenirse) ayrı bir issue ile prebuild stratejisini ayarlarız.

## Test

Mobile workspace henüz vitest kurulu değil; saf-logic helper'lar Web tarafındaki ikizleriyle birlikte ([apps/web](../web/)) test ediliyor. RN bileşenleri için detox / maestro tabanlı E2E gelecek bir issue ile gelir (ilgili ADR yok henüz).

## İlişkili işler

- [ADR 0006](../../docs/adr/0006-token-storage.md) — token saklama (SecureStore zorunlu).
- [ADR 0017](../../docs/adr/0017-dual-mode-auth.md) — dual-mode auth.
- [ADR 0019](../../docs/adr/0019-identity-provider-clerk.md) — cloud kimlik sağlayıcı Clerk.
- [ADR 0024](../../docs/adr/0024-local-discovery-rely-on-ha-hostname.md) — `*.local` keşfi.
