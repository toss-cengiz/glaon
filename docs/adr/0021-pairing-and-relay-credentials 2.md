# ADR 0021 — Pairing protocol + relay credential lifecycle

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-07
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue #341 (this ADR), issue #346 (B4 — pairing endpoint), issue #349 (D2 — addon pairing UI), issue #354 (E3 — web pairing wizard), issue #357 (G3 — mobile pairing wizard), [ADR 0017 — dual-mode auth](0017-dual-mode-auth.md), [ADR 0018 — cloud relay topology](0018-cloud-relay-topology.md), [ADR 0019 — Clerk](0019-identity-provider-clerk.md), [ADR 0020 — CF Workers + DO](0020-cloud-hosting-platform.md)

## Bağlam

[ADR 0017](0017-dual-mode-auth.md) cloud-mod'un addon agent ↔ cloud arasında kalıcı bir kimlik (`relay_secret`) gerektiğini, [ADR 0018](0018-cloud-relay-topology.md) ise bu secret'ın addon'un outbound WS handshake'inde kullanılacağını belirlediğini belirledi. Ama **bu secret'ın nasıl mint edildiği**, **nasıl döndürüldüğü** ve **nasıl iptal edildiği** açık. Bu ADR onu kilitliyor.

Pairing süreci aynı zamanda **kullanıcı kimliği ↔ ev kimliği** köprüsünü kuran an: kullanıcı Clerk'le login ediyor, evdeki addon'un yine bu kullanıcının olduğunu kanıtlamak gerekiyor. Bu bağ kurulmadan multi-home senaryosu (Phase 5 #30) anlamsız.

Tartışma çerçevesi:

- **Auth flow şekli:** OAuth2 device-code (Google smart TV / Microsoft 365), QR kod, manuel link kopyalama, BLE direct discover, mDNS auto-pair... Her birinin UX + güvenlik trade-off'u var.
- **Secret yaşam döngüsü:** Secret mint anı; storage hem cloud hem agent'ta; rotasyon; revocation; audit.
- **Saldırı vektörleri:** Replay (eski code'la pair atma), brute force (6-haneli code 1M olasılık), MITM (kullanıcı code'u entry sırasında sahte bir UI'a yapıştırırsa), addon-side secret leak (HA backup'ı sızdırırsa), code interception (paylaşımlı sosyal kanal).
- **Addon-tarafı storage:** HA add-on'lar `/data/options.json` ile config tutar; bu dosya HA Supervisor backup'ında yer alıyor. Plain mı tutalım, encrypt mi edelim? Hangi anahtarla?
- **Multi-pair:** Aynı evde birden çok client (mobile + tablet + web) — pair her client başına mı, yoksa ev başına bir secret + tüm client'ler aynı secret'ı kullanır mı?

Göz önünde bulundurulan alternatifler:

- **Seçenek A — OAuth2 device authorization grant (RFC 8628):** Reddedildi (kısmen). Standart device-code flow client (Glaon mobile) ↔ cloud ↔ user-agent (Glaon web/tarayıcı) için yapılmış. Bizim senaryomuz farklı: client (zaten Clerk-authed) → cloud → addon (HA Supervisor'da unattended çalışıyor). Standart flow'un OOB (out-of-band) channel'ı yok; yani user code'u manuel okumalı/girmeli — bizim de planımız bu, yani ruhen aynı ama RFC'ye uyum gereksiz.
- **Seçenek B — QR kod tabanlı pair:** Reddedildi (zaman). Cloud bir QR üretir, addon HA UI'da gösterir, mobile kamerayla okur. UX süper ama Phase 2 sıkı zamanda QR generation + camera permission flow + cross-platform QR scanner ekstra iş. v2 hedefi olarak masada.
- **Seçenek C — BLE pair:** Reddedildi. HA add-on'da BLE access standart değil, ev cihazlarında varsa overhead büyük. Apple Home / Google Home şeysi bu yola gitmiş ama biz tersine — kullanıcı zaten internete bağlı.
- **Seçenek D — Device-code style: 6-haneli code, single-use, 10dk TTL (seçilen):** Karar bölümünde detay. Standart pattern (MS / Google smart TV pairing); mevcut kullanıcı tanışıklığı + minimum implementation cost.

## Karar

**Pairing flow device-code style donduruluyor: cloud 6-haneli kod üretir, kullanıcı code'u addon'un Ingress UI'sine girer, addon code'u kanıtlayarak `relay_secret` claim eder.**

### Sequence diagram

```
┌────────────┐                    ┌─────────────┐                   ┌──────────────┐
│  Client    │                    │  Cloud      │                   │  Addon (HA)  │
│  (mobile/  │                    │  (apps/cloud│                   │  Ingress UI  │
│   web)     │                    │   B4)       │                   │              │
└─────┬──────┘                    └──────┬──────┘                   └──────┬───────┘
      │                                  │                                 │
      │ 1. Sign in (Clerk JWT)           │                                 │
      │─────────────────────────────────►│                                 │
      │                                  │                                 │
      │ 2. POST /pair/initiate           │                                 │
      │   Authorization: Bearer <jwt>    │                                 │
      │─────────────────────────────────►│                                 │
      │                                  │ 3. Generate 6-digit code        │
      │                                  │   - Single-use                  │
      │                                  │   - 10min TTL                   │
      │                                  │   - Bound to clerkUserId        │
      │ 4. ← { code: "XYZ123",           │                                 │
      │     expiresAt }                  │                                 │
      │◄─────────────────────────────────│                                 │
      │                                  │                                 │
      │ 5. UI shows: "Enter XYZ123 in    │                                 │
      │    addon's pairing page"         │                                 │
      │                                  │                                 │
      │      6. User opens addon's /pair page in HA Ingress (already auth'd via HA session)
      │      ─────────────────────────────────────────────────────────────►│
      │                                  │                                 │
      │      7. User types XYZ123        │                                 │
      │                                  │                                 │
      │                                  │ 8. POST /pair/claim             │
      │                                  │   Body: { code: "XYZ123" }      │
      │                                  │◄────────────────────────────────│
      │                                  │                                 │
      │                                  │ 9. Verify code (single-use,     │
      │                                  │    not expired, not revoked)    │
      │                                  │                                 │
      │                                  │ 10. Mint:                       │
      │                                  │     - homeId (UUID)             │
      │                                  │     - relay_secret (256 bit)    │
      │                                  │     - bcrypt-hash secret in DB  │
      │                                  │                                 │
      │                                  │ 11. ← { homeId, relay_secret }  │
      │                                  │────────────────────────────────►│
      │                                  │                                 │
      │                                  │  12. Addon stores secret to     │
      │                                  │      /data/options.json         │
      │                                  │                                 │
      │                                  │  13. Addon opens outbound WS    │
      │                                  │      to /relay/agent with       │
      │                                  │      Authorization:             │
      │                                  │      Bearer <relay_secret>      │
      │                                  │◄────────────────────────────────│
      │                                  │                                 │
      │                                  │ 14. Cloud verifies bcrypt hash, │
      │                                  │     marks home online           │
      │                                  │                                 │
      │ 15. Client subscribed to home    │                                 │
      │     via session WS              │                                  │
      │     (ADR 0018 protocol)         │                                  │
```

### Kod özellikleri

- **Format:** 6 hane, base32 alfabesi (rakamlar + A-Z, ambiguous karakterler `O/0/1/I/L` çıkarılır → 30 karakterlik alfabe). Toplam olasılık: 30^6 = 729M. Brute force için yeterince geniş.
- **TTL:** 10 dakika. Code init edildiğinde DB'de `expiresAt` ile saklanır.
- **Single-use:** Claim edildikten sonra DB'de `claimedAt` set edilir; tekrar kullanım reddedilir.
- **Bound to user:** Code, init eden Clerk user'ı ile mühürlü. Claim edildiğinde mint edilen `homeId` o user'a ait olur.

### Rate limit + replay protection

- **Per-IP throttle (claim endpoint):** 5 başarısız deneme/dakika. Aşıldığında 5dk lockout. Cloud Worker rate-limit middleware (CF Workers KV ile counter).
- **Per-clerkUser throttle (initiate endpoint):** 10 code/saat. Spam initiate'i frenleme.
- **Brute force defense:** Per-code başına 5 yanlış deneme → code revoked + audit log.
- **Replay:** Single-use kuralı + nonce tracking. Aynı code'u iki ev claim etmeye çalışırsa ikinci 409 Conflict alır.
- **Code transmission:** Code QR olarak değil, **kullanıcı UI'da görüyor + manuel** addon'a giriyor. Sosyal kanaldan (chat, email) kopyalama mümkün ama sosyal mühendislik baskısı düşük (10dk TTL).

### Relay secret yaşam döngüsü

- **Mint:** 256-bit (32 byte) cryptographically secure random, base64url encoded → URL-safe string ~43 karakter. Worker `crypto.getRandomValues()` ile.
- **Cloud-side storage:** **Bcrypt hash** (cost factor 10) D1 `homes.relay_secret_hash` kolonunda. Plaintext secret cloud'da hiç saklanmaz. Worker uyumlu lib: `bcryptjs` (pure JS, V8 isolate'de çalışır).
- **Addon-side storage:** **Plaintext** `/data/options.json` içinde, `relay_secret` field'ı olarak. **Kabul edilen risk:**
  - HA Supervisor backup'larında bu dosya plain-encoded yer alır.
  - Addon container içinde root erişimi olan herhangi bir process secret'a ulaşabilir.
  - Mitigasyon: Addon hardening (#351 — AppArmor profile, secret file 0600 mode, non-root user) bu yüzeyi daraltır.
  - **Not:** HA add-on platformunda secret encryption-at-rest yerleşik olarak yok. Kullanıcının Supervisor'a güveni baseline; daha sıkı izolasyon Phase 4 hardening'inde değerlendirilebilir.
- **Rotation:** Kullanıcı cloud portal'dan (`apps/cloud` admin UI, Phase 2 v0'da minimal) "rotate" butonuyla tetikler. Akış: cloud yeni secret mint eder, addon agent control frame `revoked { reason: 'rotation' }` alır, WS kopar, addon kullanıcıya "yeniden pair" UI bildirimi gösterir, kullanıcı yeni code'u alır. Eski hash invalid.
- **Revocation:** Kullanıcı cloud'dan "remove home" yapar veya cloud abuse detection trigger eder. Akış: hash DB'den silinir, agent WS forced-close (`revoked { reason: 'user_revoked' | 'abuse' }`), addon kendi secret'ını silmesi için kullanıcıya local UI prompt'u verir.
- **Audit:** Her `pair_initiate`, `pair_claim`, `pair_rotate`, `pair_revoke` event'i D1 `pair_events` tablosuna yazılır (clerkUserId, homeId, ip, userAgent, ts, eventType, reason). Phase 5 audit log epic'i bu tabloyu UI'da gösterir.

### Multi-pair (aynı home, multiple clients)

- **Tek `relay_secret` per home:** Mobile + tablet + web aynı `homeId`'ye bağlı; ama **her client kendi Clerk JWT'siyle** cloud session açıyor (ADR 0018 sessionId). Yani:
  - Bir secret, addon ↔ cloud arasında.
  - Her client cloud ↔ addon arasında ayrı session.
- **Pair flow client-başı değil home-başı.** Kullanıcı bir kez pair eder; sonradan eklenen client'ler (Glaon hesabıyla aynı kullanıcı login olduğu sürece) home'a otomatik erişir (cloud `homes.ownerClerkUserId` lookup'ı).
- **Devam: ev paylaşımı (guest mode #31):** Phase 5'te bir kullanıcının evine başka bir Clerk user'ı eklenecek (ACL). O zaman `pair_claim` modeli korunur, ama `homes.ownerClerkUserId` → `home_members(homeId, clerkUserId, role)` tablosuna evrilir. Bu ADR yalnız Phase 2 single-owner modelini kilitliyor.

### Tehdit modeli

| Saldırı                          | Mitigasyon                                                                                    | Kalan risk                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Replay (eski code)**           | Single-use + 10dk TTL                                                                         | TTL içinde duplicate use → ilk gelen kazanır                                              |
| **Brute-force code**             | 30^6 = 729M space; per-IP + per-code rate limit; lockout                                      | Hedefli saldırgan low-rate ile deneyebilir; audit yakalar                                 |
| **MITM (sahte addon UI)**        | User HA'nın Ingress URL'inde olmalı (HA cookie); MITM ancak HA-tarafı ele geçirildiyse mümkün | HA host compromise → tüm sistem zaten yandı; bu ADR'in skobu dışı                         |
| **Addon secret leak**            | 0600 file mode, AppArmor (#351); HA backup encrypted at rest (Phase 4 hardening)              | Backup açıkta tutulursa secret çıkar; rotation hızlı (kullanıcı 30s'de rotate edebilir)   |
| **Code social-channel paylaşım** | 10dk TTL + single-use; uyarı UI'da ("Bu kodu paylaşmayın")                                    | İnsan hatası — UX uyarısı + audit log uyandırma                                           |
| **Cloud DB compromise**          | Secret hash, plaintext değil; Clerk hesap claim auth gerekli                                  | Hash brute force teorik (bcrypt cost 10) — saldırganın günler sürer; rotation tetikleyici |
| **Compromised relay (cloud)**    | HA OAuth tokenı cloud'da yok (ADR 0017); cloud sadece envelope routing                        | HA frame içeriği cloud'a görünür — privacy bedeli; ADR 0018 invariant'ı ile yönetildi     |

## Sonuçlar

### Olumlu

- **Tanıdık UX:** Kullanıcılar bu pattern'i (TV pairing, CLI device login) zaten biliyor; öğretim eğrisi düşük.
- **Hızlı implementation:** 6-haneli code generator + DB lookup + bcrypt hash → bir hafta içinde B4 (#346) implemente edilir.
- **Audit trail:** Pair eventleri D1'de izlenebiliyor; abuse / debug için immediate visibility.
- **Multi-client native:** Tek secret + per-client Clerk auth modeli, mobile + tablet + web parity'sini ücretsiz veriyor.
- **Rotation-ready:** Secret rotation Phase 2 v0'da elementary ama mekanizma var; security incident'inde hızlı response.

### Olumsuz / ödenecek bedel

- **Plaintext addon secret:** HA Supervisor backup'larında secret görünür → backup leak senaryosu var. Mitigasyon: rotation hızlı + addon hardening + kullanıcı backup encryption (HA Cloud Backups feature) önerisi docs'ta. Risk kabul edildi.
- **Code social engineering yüzeyi:** Kullanıcı code'u yanlış UI'a yazarsa pair sahibinin sahibi başkası olur. Mitigasyon: UI uyarı + 10dk TTL. Sıfır değil ama kabul edilebilir.
- **Manual entry friction:** 6 hane manuel girilmeli — UX QR'a göre yavaş. v2'de QR opsiyonu açık.
- **Phase 5 multi-owner geçişi work gerektirir:** Bu ADR'in `homes.ownerClerkUserId` kolon imzası multi-owner için `home_members` tablosuna evrilmek zorunda. Schema migration: minor work, breaking client değil.

### Etkileri

- **Cloud backend (B4 — #346):** `/pair/initiate` + `/pair/claim` + `/pair/rotate` + `/pair/revoke` endpoint'leri. D1 schema: `homes`, `pair_codes`, `pair_events`. Rate limit middleware. Bcrypt hash.
- **Addon (D2 — #349):** HA Add-on Ingress'in `/pair` sub-page'i (kullanıcı code girer → `/pair/claim`). Secret saklama (`/data/options.json`). Addon agent (D1 — #348) bu secret ile WS açar.
- **Web pairing wizard (E3 — #354):** Sign in → POST /pair/initiate → 6-haneli code göster + QR opsiyonel (v0'da yok) + step-by-step talimatlar.
- **Mobile pairing wizard (G3 — #357):** Aynı; ek olarak deep link `glaon://pair?code=XYZ` desteği (kullanıcı mobile'dan code'u kopyalayıp addon'a yapıştırma yerine reverse opsiyonel).
- **Audit UI:** Phase 2 v0'da admin dashboard yok; `pair_events` D1'de kalır, gerektiğinde manual SQL ile sorgulanır. Phase 5 admin epic'inde UI gelecek.
- **Schema:** D1 migration `pair_codes` (id, code, clerkUserId, expiresAt, claimedAt, homeId), `homes` (homeId, ownerClerkUserId, relaySecretHash, createdAt, revokedAt), `pair_events` (id, eventType, clerkUserId, homeId, ip, userAgent, ts, reason).

## Tekrar değerlendirme tetikleyicileri

- **Brute force başarılı:** Code space (30^6) yetmediği bir vaka olursa — code uzunluğu 8 haneye çıkar veya alfabe genişler.
- **Backup leak vakası:** Real-world bir kullanıcı backup'ı sızar ve relay_secret kullanılırsa — addon-side encryption-at-rest ihtiyacı (HA Supervisor secret store API'sını kullanmak) gündeme gelir.
- **QR pair adoption isteği:** Kullanıcı %20+ pair flow'unda manual entry'yi terk ederse — QR alternative implementation'ı v2'de.
- **Multi-owner ihtiyacı:** Phase 5 multi-home ya da guest mode aktif olduğunda bu ADR superseded olur (yeni ADR ile schema evrim'i kayda geçer).
- **HA Supervisor Secret Store API:** HA bir günlerde add-on'lar için yerleşik secret encryption sunarsa — addon-side plain storage modeli yenilenir.
- **Compliance audit:** SOC2 / GDPR audit pair flow'unda bcrypt cost factor'ünü düşük bulursa — hash algoritması Argon2id'e veya cost factor 12+'a çıkar.

## Referanslar

- Issue [#341 — pairing protocol + relay credential lifecycle](https://github.com/toss-cengiz/glaon/issues/341) — bu ADR'in tracking issue'su.
- Issue [#346 — B4 pairing endpoint](https://github.com/toss-cengiz/glaon/issues/346) — cloud-side implementation.
- Issue [#349 — D2 addon pairing UI](https://github.com/toss-cengiz/glaon/issues/349) — addon-side implementation.
- Issue [#354 — E3 web pairing wizard](https://github.com/toss-cengiz/glaon/issues/354).
- Issue [#357 — G3 mobile pairing wizard](https://github.com/toss-cengiz/glaon/issues/357).
- Issue [#351 — addon hardening (AppArmor, secrets perms)](https://github.com/toss-cengiz/glaon/issues/351) — secret file 0600 + AppArmor profile.
- [ADR 0017 — dual-mode auth](0017-dual-mode-auth.md) — secret pairing'in pozisyonu.
- [ADR 0018 — cloud relay topology](0018-cloud-relay-topology.md) — addon agent WS handshake'inde secret kullanımı.
- [ADR 0019 — Clerk](0019-identity-provider-clerk.md) — pair/initiate Clerk JWT ile auth.
- [ADR 0020 — CF Workers + DO](0020-cloud-hosting-platform.md) — Worker rate limit + D1 storage.
- RFC 8628 (OAuth 2.0 Device Authorization Grant): <https://datatracker.ietf.org/doc/html/rfc8628> — referans alındı, RFC'ye uyulmadı (uyum gereksiz).
- bcryptjs (Worker-uyumlu): <https://github.com/dcodeIO/bcrypt.js>
