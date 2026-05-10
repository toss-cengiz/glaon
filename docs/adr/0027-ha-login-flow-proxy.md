# ADR 0027 — HA `login_flow` password-grant proxy (cloud-side)

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-10
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [issue #467](https://github.com/toss-cengiz/glaon/issues/467) (epic), [issue #468](https://github.com/toss-cengiz/glaon/issues/468) (bu ADR), [ADR 0005](0005-oauth2-pkce-only-auth.md) (superseded), [ADR 0017](0017-dual-mode-auth.md), [ADR 0019](0019-identity-provider-clerk.md), [ADR 0025](0025-apps-api-stack.md), [ADR 0026](0026-apps-api-delivery-hosted.md)

## Bağlam

Phase 2 Auth UI tasarımı (Figma Design System file, [node 134:3146](https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=134-3146)) Login ekranını tek bir split-screen sayfa olarak konumluyor: solda Glaon-rendered form (Device | Cloud tab toggle), sağda hero görseli. **Device sekmesi**nde kullanıcı Username + Password'ünü doğrudan Glaon UI'da giriyor; HA'nın OAuth redirect ekranı görünmüyor.

Bu, [ADR 0005](0005-oauth2-pkce-only-auth.md) ve [ADR 0017](0017-dual-mode-auth.md)'in local mod auth path'i ile çelişiyor: bu ADR'ler HA'nın `/auth/authorize` redirect'ini kullanıyor, kullanıcı HA'nın kendi login formunu görüyor. Ürün hedefi (Glaon-native Device login UX) bu pencereyi kabul etmiyor — split-screen Login içinde "Continue with Home Assistant" pop-up'ı brand tutarsızlığı yaratıyor; mobile'da Expo browser açar; addon Ingress senaryosunda ekstra hop'lar üretir.

Tartışma çerçevesi:

- **Credentials nereden toplanır?** Front-end mi (HA'ya doğrudan POST), `apps/api` mi (server-side proxy)?
- **HA refresh token nereye düşer?** Cloud DB'ye persist mi, sadece response'ta opaque biçimde geçişine izin mi?
- **MFA/2FA aktif kullanıcılar nasıl handle edilir?** Bu PR scope'unda mı, ayrı follow-up mı?
- **PKCE gerekli mi?** Kullanıcı redirect-flow yerine in-app form kullanıyorsa code_verifier'ın koruması anlamlı mı?

Göz önünde bulundurulan alternatifler:

- **Seçenek A — HA OAuth Authorization Code redirect (status quo, ADR 0005).** UX bozuk: split-screen Login içinde HA UI tutarsız, mobile'da Expo browser handoff zorlu. Reddedildi: ürün hedefiyle çelişiyor.
- **Seçenek B — Long-Lived Access Token (LLAT) yapıştırma.** Ev sahibi setup'ta HA UI'dan LLAT üretip Glaon'a girer; sonraki cihazlar bu token'la çalışır. Reddedildi: CLAUDE.md `LLAT yasağı` ile çakışır (refresh yok, revocation manual; token sızıntısının impact'i sürekli, rotasyon yok). Figma'daki Device tab Username/Password formu da anlamsız hale gelirdi.
- **Seçenek C — Front-end direct `login_flow` POST.** Front-end credentials'ı doğrudan HA'ya POST eder. Reddedildi: front-end'de credentials taşımak attack surface'i büyütüyor (CSP, log scrubbing, error reporter scrubbing); HA'nın CORS yapılandırması her instance'da farklı olabiliyor.
- **Seçenek D — `apps/api` üzerinden stateless proxy (seçilen).** Karar bölümünde detay.
- **Seçenek E — Web-only proxy (mobile native HA OAuth korur).** İki kod yolu Glaon'un "tek auth contract" prensibini bozar (ADR 0017). Reddedildi.

## Karar

**Glaon'un Device-mode login'i, kullanıcının HA OAuth redirect'i hiç görmeyeceği şekilde, `apps/api`'nin `POST /auth/ha/password-grant` endpoint'i üzerinden HA'nın resmi `/auth/login_flow` API'sine stateless proxy yapılarak gerçekleştirilir; `apps/api` HA tokenlarını persist etmez, response'ta opaque biçimde istemciye akıtır ve istemci bunları `local` slot grubuna yazar.**

Karar'ın teknik detayları:

### Endpoint kontratı

`POST /auth/ha/password-grant` (`apps/api/src/routes/auth.ts`):

- Request: `{ haBaseUrl, username, password, clientId }` — Zod doğrulaması `HaPasswordGrantRequestSchema` (`packages/core/src/api-client/schemas.ts`).
- Response (200): `{ haAccess: { accessToken, refreshToken, expiresIn, tokenType: 'Bearer' }, sessionJwt, expiresAt }`.
- Hata branch'leri: `400 invalid` (bad body), `400 invalid-url`, `401 invalid-credentials`, `502 mfa-required`, `502 unreachable`, `502 flow-error`.

### HA login_flow protokolü

Helper `loginFlow(haBaseUrl, credentials, options)` (`apps/api/src/auth/ha-bridge.ts`) üç sıralı çağrı yapar:

1. `POST {haBaseUrl}/auth/login_flow` body `{ client_id, handler: ["homeassistant", null], redirect_uri }` → `{ flow_id, type: "form" }`.
2. `POST {haBaseUrl}/auth/login_flow/{flow_id}` body `{ username, password, client_id }` →
   - `{ type: "create_entry", result: <auth_code> }` → step 3
   - `{ type: "form", step_id: "mfa", ... }` → `mfa-required` (out-of-scope, 502)
   - `{ type: "abort", reason: "invalid_auth" }` → `invalid-credentials` (401)
3. `POST {haBaseUrl}/auth/token` form-urlencoded `grant_type=authorization_code&code=<...>&client_id=<...>` → `{ access_token, refresh_token, expires_in, token_type }`.

Referans: <https://developers.home-assistant.io/docs/auth_api>.

### Invariants

- **HA refresh tokenları `apps/api` veritabanında persist edilmez** — yalnızca response payload'unda istemciye geri akar. İstemci tokenları `local` slot grubuna yazar (web in-memory + httpOnly cookie; mobile SecureStore — [ADR 0006](0006-token-storage.md)). Bu, ADR 0017'in "HA token cloud'a transit etmez" invariant'ının yumuşamadığı anlamına gelir: `apps/api` cloud-relay değil, stateless proxy + zero-persistence kuralı geçerli.
- **PKCE code_verifier kullanılmaz.** `login_flow` endpoint'inin döndürdüğü auth code single-use ve `client_id`'ye internal olarak bağlı; redirect interception riski yok (redirect zaten yok).
- **MFA bu PR'da kapsanmaz.** HA `step_id: "mfa"` döndürdüğünde 502 `{ error: "mfa-required" }` ile kullanıcıya UI tarafında "Multi-factor auth not yet supported in Glaon — sign in via Home Assistant directly" mesajı gösterilir. Phase 2.5 issue olarak `phase-2-mfa-support` açılır.
- **Endpoint'i sadece Glaon-managed `apps/api` instance'ı barındırır** — self-host alternatifi yok ([ADR 0026](0026-apps-api-delivery-hosted.md)).

### Cookie davranışı

`/auth/exchange` ile aynı: Origin `webOrigins` allowlist'inde ise `Set-Cookie: glaon_session=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=...`. Mobile (Origin yok) cookie almaz, response body'sindeki `sessionJwt`'yi SecureStore'a yazar.

### Session JWT

Mevcut `mintSessionJwt(secret, { userId, ttlSeconds })` reuse edilir; `userId` `deriveUserId(haAccessToken)` ile türetilir (HA OAuth2 access token JWT ise `sub` claim, opaque ise stable hash). TTL config'den (`config.sessionTtlSeconds`, default 1h).

## Sonuçlar

### Olumlu

- **Brand sürekliliği:** Kullanıcı Device login sırasında Glaon UI'sından çıkmıyor; Figma tasarımı ödünsüz uygulanır.
- **Front-end attack surface azalır:** Credentials front-end JS'te ham haldeyken HTTPS round-trip'i tek (apps/api'ye); HA'nın CORS varsayımları, log scrubbing, error reporter scrubbing'i front-end'e dert değil.
- **HA tokenları yine cloud'da yaşamaz:** ADR 0017 invariant'ı korunuyor — yalnız response payload geçişi var, persist yok.
- **Mevcut kod yolu ile uyum:** Yeni endpoint mevcut `mintSessionJwt`/`introspectHaToken` pattern'lerini reuse ediyor; cookie + revocation davranışı aynı.

### Olumsuz / ödenecek bedel

- **Yeni MFA blind spot:** HA'da 2FA aktif kullanıcılar şu an Device login'i kullanamıyor (502 + "Sign in via HA directly" inline mesajı). Bu kullanıcılar hâlâ HA OAuth redirect'i (eski yol) ile login olabilir mi? Bu PR scope'unda eski yol kapatılıyor — Phase 2.5 MFA UX'i merge olana kadar bu kullanıcılar için Device login bozuk.
- **`apps/api` rate-limit yüzeyi büyüdü:** Password-grant brute-force vector. Bu PR `apps/api` üzerinde rate-limit eklemiyor — Phase 2.5 token-bucket issue'su (`apps/api`'ye redis + sliding window) takip eder.
- **HA `client_id` URL host check'i:** HA, `client_id` URL host'unun `redirect_uri` ile eşleştiğini doğruluyor. Web add-on Ingress senaryosunda bu doğrulama beklenmedik şekilde başarısız olabilir; takip issue'su `auth-ingress-redirect-handling` (G3) açıldı.

### Etkileri

- **`apps/api` route surface:** `POST /auth/ha/password-grant` ekleniyor. `/auth/exchange`, `/auth/refresh`, `/auth/logout` davranışı değişmiyor.
- **`packages/core/src/api-client`:** Yeni `HaPasswordGrantRequest/Response/Error` Zod şemaları + `apiClient.haPasswordGrant(body)` metodu. Web + mobile bu metodu çağırır.
- **`apps/web` ve `apps/mobile`:** Login Device tab'ı bu endpoint'i kullanır (issue #470'te entegre edilir). Eski local-mode OAuth redirect kod yolu Login screen'inden kaldırılır.
- **ADR 0005:** Zaten Superseded by ADR 0017; bu ADR ek olarak ADR 0017'in local mode auth path'ini "OAuth redirect VEYA login_flow proxy" olarak genişletir. ADR 0017 supersede edilmez.
- **`docs/api.md`:** Yeni endpoint Türkçe dökümana eklenir.

## Tekrar değerlendirme tetikleyicileri

- HA `/auth/login_flow` API'si breaking change yaparsa (ör. `handler` shape değişir) — bu ADR'in protokol detayları update edilir, ana karar değişmez.
- Phase 2.5 MFA support bu yaklaşımı genişletmek yerine yeni bir mekanizma (örn. WebAuthn fallback) gerektirirse — yeni bir ADR ile tartışılır.
- HA bir resmi non-redirect public auth API'si yayınlarsa (e.g. password-grant endpoint) — bu ADR'in `login_flow` proxy detayları yeniden değerlendirilir.

## Referanslar

- [Home Assistant Auth API](https://developers.home-assistant.io/docs/auth_api) — `login_flow` ve `/auth/token` endpoint protokolü.
- [Figma — Login design](https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1267-132397) — Device tab tasarımı.
- [issue #467](https://github.com/toss-cengiz/glaon/issues/467) — Phase 2 Auth UI epic.
- [issue #468](https://github.com/toss-cengiz/glaon/issues/468) — bu ADR'in tracking issue'su.
- [ADR 0017](0017-dual-mode-auth.md) — "HA token cloud'a transit etmez" invariant'ının kaynağı.
- [ADR 0026](0026-apps-api-delivery-hosted.md) — `apps/api` Glaon-managed hosted servisi olarak çalışır.
