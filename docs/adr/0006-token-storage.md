# ADR 0006 — Token storage: in-memory + httpOnly cookie (web) / SecureStore (mobile)

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-20
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [docs/SECURITY.md](../SECURITY.md), [CLAUDE.md — Security-First Rules](../../CLAUDE.md#security-first-rules), ADR 0005

> **Phase 2 revizyonu (2026-05-07):** Cloud mod (ADR 0017) `cloud-session` slot'unu eklediğinde `TokenStore` üç slot grubuna (`ha-access`, `ha-refresh`, `cloud-session`) genişledi. Saklama modeli ve güvenlik modeli aynen geçerli — yeni slot Clerk session JWT'sini taşır; web'de in-memory, mobile'da SecureStore'da yaşar. Implementation issue [#9](https://github.com/toss-cengiz/glaon/issues/9). Detaylar için bkz. [ADR 0017 — dual-mode auth](0017-dual-mode-auth.md).

## Bağlam

ADR 0005 ile OAuth2 PKCE seçildi. Geriye access + refresh token'ları her istemcide güvenli saklama kararı kaldı. Saldırı modelleri:

**Web:**

- **XSS** → en büyük risk. Eğer token `localStorage` veya `sessionStorage`'da tutulursa, herhangi bir XSS (üçüncü parti script, eklenti, supply chain) token'ı çalabilir. CSP zaten sıkı (ADR'de yer almıyor, [docs/SECURITY.md](../SECURITY.md) tanımlıyor) ama XSS riskini sıfıra indirmiyor.
- **CSRF** → cookie kullanırsak SameSite=Strict + CSRF token kombinasyonu.
- **Network intercept** → HTTPS + TLS pinning mobile'da. Web'de HA Ingress zaten HA'nın TLS'i içinde.

**Mobile:**

- **Cihaz fiziksel erişim** → cihaz lock'u bypass edilirse storage sızabilir. iOS Keychain + Android Keystore hardware-backed korumayı kullanmak zorunlu.
- **AsyncStorage veya plain file** → root'lu cihazda düz okunabilir; kullanılamaz.
- **Memory dump** → root/jailbreak senaryosunda kaçınılmaz; kabul edilen risk.

Değerlendirilen web stratejileri:

- **localStorage:** XSS ile tamamen kompromize. CLAUDE.md bunu doğrudan yasaklıyor.
- **sessionStorage:** Aynı XSS problemi, sadece tab kapanınca silinir — güvenlik artışı yok.
- **In-memory (JS değişkeni):** XSS çalması için script'in aktif session'a ulaşması gerek. Refresh'te kaybolur → kullanıcı her sekme açtığında yeniden login. UX kötü.
- **In-memory access + httpOnly+SameSite=Strict cookie'de refresh token:** Access token JS'e açık ama short-lived (30 dk); refresh token JS'e görünmez (XSS sızdıramaz). Glaon için HA proxy behind nginx (Add-on içinde) bu pattern'i destekleyebilir.
- **Service Worker ile token proxy:** Service Worker arka planda request'leri intercept edip Authorization header'ı ekler. Token SW scope'unda kalır. Karmaşık ama güvenliği yüksek. Değerlendirildi ama ilk sürüm için overkill.

Mobile stratejileri:

- **AsyncStorage** — plain file, yasak.
- **expo-secure-store** — iOS Keychain + Android Keystore wrapper. Hardware-backed encryption, biometric gate opsiyonel.
- **Native modül ile keystore direkt erişim** — Expo managed workflow'u bozar, gerek yok.

## Karar

**Web:**

- Access token **in-memory** değişkeninde (React context/store). Refresh'te kaybolur, silent refresh flow ile yeniden alınır.
- Refresh token **httpOnly + SameSite=Strict + Secure cookie**'de. Add-on nginx proxy'si `/auth/token` endpoint'ini terminate edip Set-Cookie ayarlıyor. JS koduna refresh token asla girmiyor.
- Standalone web (Ingress dışı) senaryoda nginx yerine HA reverse proxy bu cookie işini yapacak; ayrıntı deploy-time.

**Mobile:**

- Access + refresh token ikisi de **`expo-secure-store`**'da (`keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`).
- Biometric lock opsiyonu kullanıcı ayarı olarak eklenecek (issue açılacak).
- AsyncStorage'a kesinlikle yazılmaz; ESLint kuralı `@react-native-async-storage/async-storage` import'unu `apps/mobile/src/**` dışında yasaklar.

## Sonuçlar

### Olumlu

- Web'de XSS sızıntısı access token'ı 30 dakika içinde veriyor, refresh token'ı asla — saldırı zaman penceresi dar.
- Cookie SameSite=Strict CSRF'i nötralize ediyor.
- Mobile'da token hardware-backed keystore'da; root olmayan cihazda pratik olarak sızdırılamaz.
- CLAUDE.md güvenlik kuralları netleştirilmiş, kural ihlali linter/security-review skill tarafından yakalanıyor.

### Olumsuz / ödenecek bedel

- Cookie tabanlı refresh flow backend'de (nginx / HA proxy) ek konfigürasyon istiyor — deployment ayarları karmaşıklaşıyor.
- Silent refresh cycle'ı web'de user-experience için görünmez olmalı; tab'lar arası refresh token koordinasyonu (BroadcastChannel veya Web Lock API) gerekebilir.
- `expo-secure-store`'un bazı Android sürümlerinde biometric gate davranışı tutarsız (özellikle eski OEM cihazlar); kullanıcı raporlarını takip etmek gerek.
- Token rotation sırasında race condition riski — concurrent request'ler tek refresh'e kilitlenmeli (mutex pattern).

### Etkileri

- `@glaon/core` içindeki `AuthClient`, platform-spesifik `TokenStorage` interface'ini enjekte alacak.
  - `WebHttpOnlyCookieStorage` — refresh token cookie üzerinden, access token memory.
  - `ExpoSecureStoreStorage` — refresh + access secure store.
- Nginx config (Add-on) `/auth/token` + `/auth/revoke` proxy rule'larına ek olarak `Set-Cookie` ve `Clear-Site-Data` header'larını yönetecek.
- Security-review skill storage kurallarını enforce eder; bu ADR'dan sapma PR'ı otomatik flag alır.

## Tekrar değerlendirme tetikleyicileri

- Service Worker tabanlı token proxy pattern'ı olgunlaşır ve `http-only cookie` yaklaşımının ötesinde gerçek bir güvenlik kazancı üretirse.
- HA tarafı DPoP (Demonstrating Proof-of-Possession) desteklemeye başlarsa — token binding sayesinde storage risk modeli değişir.
- `expo-secure-store`'da ciddi CVE çıkarsa (alternatif `react-native-keychain` değerlendirilir).

## Referanslar

- [docs/SECURITY.md](../SECURITY.md)
- [CLAUDE.md — Security-First Rules](../../CLAUDE.md#security-first-rules)
- [OWASP JWT storage](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [expo-secure-store docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
