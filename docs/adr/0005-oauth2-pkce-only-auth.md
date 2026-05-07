# ADR 0005 — OAuth2 Authorization Code + PKCE (tek auth yöntemi)

- **Durum:** Superseded by [ADR 0017](0017-dual-mode-auth.md)
- **Karar tarihi:** 2026-04-20
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [docs/SECURITY.md](../SECURITY.md), [docs/ARCHITECTURE.md](../ARCHITECTURE.md), [HA auth API](https://developers.home-assistant.io/docs/auth_api)

## Bağlam

Home Assistant iki auth mekanizması sunuyor:

1. **OAuth2 Authorization Code** akışı — RFC 6749 + PKCE (RFC 7636). HA'nın `/auth/authorize` + `/auth/token` endpoint'leri. Access token + refresh token döner, access 30 dakika yaşar.
2. **Long-Lived Access Token (LLAT)** — kullanıcının UI'dan ürettiği, dönmeyen, manuel revoke edilene kadar yaşayan token. Genelde script/entegrasyon için.

Glaon bir kullanıcı istemcisi — panel, mobile, tablet. Her kullanıcı kendi HA hesabı ile giriş yapacak. Saldırı yüzeyi ve güvenlik gereksinimleri:

- Token sızıntısının etkisi **minimum** olmalı — LLAT sızarsa revoke edilene kadar kullanılabilir, sınırsız.
- Mobile uygulamada redirect URL'inde code intercept edilme riski → PKCE kaçınılmaz.
- Tarayıcıda token XSS riski → in-memory + short-lived access + refresh rotation zorunlu (bkz. ADR 0006).
- Çok kullanıcı (aile / misafir) — her kullanıcı kendi oturumu.

Alternatifler:

- **LLAT tek auth yöntemi:** UX: kullanıcı HA'ya git, "long-lived token oluştur", kopyala, Glaon'a yapıştır. Dezavantaj: token sızarsa sınırsız yaşam, kullanıcı-başı token yönetimi korkunç, sızıntıya karşı refresh/rotation yok. Reddedildi.
- **Username + password basic auth:** HA artık desteklemiyor; MFA ile uyumsuz; legacy.
- **HA'nın "webhook" ya da "trusted networks" auth'u:** Glaon'un ağ topolojisiyle iyi uymuyor (Add-on Ingress içinden HA cookie zaten geliyor ama mobile ve harici web için yetersiz).
- **OAuth2 Authorization Code + PKCE:** HA'nın resmi SPA/mobile auth akışı. Short-lived access + refresh rotation + PKCE.

## Karar

**Tüm istemciler için tek auth yöntemi: OAuth2 Authorization Code akışı + PKCE.**

- Web (tablet + tarayıcı): PKCE code verifier `@glaon/core` tarafından Web Crypto (`crypto.subtle.digest('SHA-256', ...)`) ile üretilir. Redirect URI `window.location.origin + '/auth/callback'`.
- Mobile (Expo): `expo-auth-session` PKCE flow'u. Redirect URI deep link (`glaon://auth/callback`).
- Add-on Ingress senaryosu: HA Session cookie Ingress auth'u hallettiği için web app Ingress içindeyken OAuth akışını tetiklemiyor — `auth_api: true` config flag HA kullanıcı session'ını delege ediyor. OAuth akışı standalone (Ingress dışı) web + mobile için.
- LLAT **yasak**. CLAUDE.md'de güvenlik kuralları bunu netleştiriyor.
- HA'nın `client_id` kuralı: redirect destination host'u işaret eden bir URL olmak zorunda. Her deploy için `client_id` = origin URL.

## Sonuçlar

### Olumlu

- Short-lived access token (30 dk) → sızıntının etkisi sınırlı.
- Refresh token rotation ile replay attack yüzeyi dar.
- PKCE mobile redirect intercept'i nötralize ediyor — mobil platformda OAuth için endüstri standardı.
- Kullanıcı başına oturum native olarak destekleniyor; multi-user HA kurulumlarında her kullanıcı kendi token'ıyla geliyor.
- Token invalidation HA tarafından yönetiliyor (kullanıcı HA UI'dan oturumunu sonlandırabilir).

### Olumsuz / ödenecek bedel

- Implementasyon karmaşıklığı LLAT'a göre daha yüksek; PKCE code verifier, state parameter, redirect handling hepsi doğru yazılmalı.
- Offline-first kullanım zorlaşıyor — access token süresi biter bitmez network gerekiyor; refresh cycle da online olmak zorunda.
- Kurulum deneyimi bir "client_id" ve redirect URI konfigürasyonu gerektiriyor; LLAT kadar hızlı değil.
- HA dev dokümantasyonu bazı akış detaylarında zayıf; implementasyon süresinde tuzaklar çıkacak.

### Etkileri

- `@glaon/core` içinde `AuthClient` sınıfı PKCE akışını platform-agnostic yapacak; platform-spesifik redirect + storage interface enjekte ediyor.
- `apps/web/src/auth/` ve `apps/mobile/src/auth/` yalnızca redirect + storage bind'i yapıyor, iş mantığı core'da.
- Security-review skill OAuth akışına dokunan her PR'da otomatik çağrılıyor ([CLAUDE.md — Security-First Rules](../../CLAUDE.md#security-first-rules)).

## Tekrar değerlendirme tetikleyicileri

- HA kendi OAuth modelini köklü değiştirirse (yeni endpoint, yeni flow, DPoP zorunluluğu).
- LLAT'ın özel senaryolar (CLI aracı, script-only deploy) için gerekli olduğu ikinci bir use case doğarsa — o zaman **ikinci bir auth flow** olarak eklenir, ana flow olarak değil.
- WebAuthn / passkey desteği HA tarafında eklendiğinde yeni ADR gerekebilir.

## Referanslar

- [HA Auth API](https://developers.home-assistant.io/docs/auth_api)
- [RFC 7636 — PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [OAuth 2.0 for Browser-Based Apps (BCP)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [docs/SECURITY.md](../SECURITY.md)
- [CLAUDE.md — Security-First Rules](../../CLAUDE.md#security-first-rules)
