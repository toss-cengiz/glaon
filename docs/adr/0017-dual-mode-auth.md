# ADR 0017 — Dual-mode auth: local HA OAuth + cloud-relay (Clerk)

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-07
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue #337 (this ADR), issue #338 (cloud relay topology — ADR 0018), issue #339 (Clerk — ADR 0019), issue #340 (hosting — ADR 0020), issue #341 (pairing — ADR 0021), issue #342 (deployment — ADR 0022), [ADR 0005 — OAuth2 PKCE (superseded)](0005-oauth2-pkce-only-auth.md), [ADR 0006 — Token storage](0006-token-storage.md), [ADR 0009 — HA Add-on + Ingress](0009-ha-addon-ingress-delivery.md), [ADR 0016 — HA WS transport](0016-ha-ws-transport.md)
- **Supersedes:** [ADR 0005 — OAuth2 PKCE (tek auth yöntemi)](0005-oauth2-pkce-only-auth.md)

## Bağlam

[ADR 0005](0005-oauth2-pkce-only-auth.md), Glaon'un istemcileri için **tek bir auth yöntemi** belirlemişti: HA-yerli OAuth2 Authorization Code + PKCE. O kararın bağlamında her kullanıcı kendi HA örneğine doğrudan ağ ulaşımı olduğu varsayılıyordu (LAN, VPN veya HA Cloud Nabu Casa).

Phase 2 product yönü değişti: Glaon **multi-home, dışarıdan çalışan bir SaaS** ürünü olarak da konumlanıyor. Yeni hedef kullanıcı:

- Tek bir HA örneğini ev içinden açmak istemiyor (port forwarding güvenlik riski + DDNS yönetimi).
- Birden fazla evi (kira mülkü, tatil evi, aile evi) tek bir mobil hesaptan yönetmek istiyor.
- HA hesabını — yani HA üzerindeki kullanıcı kimliklerini — Glaon kimliğinden ayrık tutmak istiyor (ev sahibi olmayan misafire Glaon hesabı verip belirli evleri paylaşmak gibi senaryolar Phase 5'te epic #30/#31 ile gelecek).

ADR 0005'in tek-yöntem kararı bu kullanım modelini engelliyor:

- HA OAuth her bağlantıda HA host'una direct ağ erişimi gerektiriyor; SaaS modunda istemci HA'yı görmüyor — Glaon cloud'unu görüyor.
- HA token'larının cloud üzerinden geçmesi (proxy mode) HA OAuth'un security model'i ile uyumsuz: token'lar cloud sunucularda lifetime boyunca takılıyor olur, sızıntı yüzeyi devasalaşır.
- Multi-home senaryosunda her ev için ayrı HA OAuth + ayrı redirect URI + ayrı `client_id` yönetmek tek istemci için kimsenin yönetemeyeceği bir karmaşıklık.

Çözüm yaklaşımı: **iki ayrı çalışma modu** — biri ev-içi (local), diğeri cloud-relay tabanlı. Mod seçimi kullanıcı + ortam kombinasyonuna göre runtime'da belirlenir; ama uygulamanın geri kalanı (entity store, service API, UI) tek bir auth contract'ı görür.

Tartışma çerçevesi:

- **Mod ayrımı nerede kapatılır?** Auth katmanı mı, transport katmanı mı, feature layer mı? Yanlış katmanda kapatılırsa "her feature `if (mode === 'cloud') ...`" yazmaya başlar.
- **HA OAuth tokenları cloud'a geçer mi?** Kararı ne kadar erken donduruyoruz? Bu güvenlik modelinin kalbi.
- **Mod aynı oturumda değişebilir mi?** Kullanıcı evdeyken local, dışarıdayken cloud — yine aynı home için. Otomatik mod-switch mi, manual mı?
- **HA-tarafı kimlik (kim hangi HA kullanıcısı?) ile Glaon-tarafı kimlik (kim Glaon ürününü kullanıyor?) ilişkisi nasıl?** Multi-home + ev sahibi/misafir ayrımı bu ayrımı zorunlu kılıyor.

Göz önünde bulundurulan alternatifler:

- **Seçenek A — ADR 0005'in tek-yöntem kararını koru, cloud erişimini Nabu Casa'ya bırak.** Reddedildi: Nabu Casa'ya bağımlılık + her ev için ek $6.50/ay aboneliği + Glaon multi-home story'sinin Nabu Casa'nın tek-ev modeline sıkışmasıyla ürün direği kırılıyor.
- **Seçenek B — HA OAuth'u cloud üzerinden proxy'le.** Reddedildi: HA token'ları cloud'da görünür hale gelir; security model'i çöker. ADR 0005'in temel garantilerinden ("token sızıntısının etkisi minimum") cloud'da mahrum kalırız.
- **Seçenek C — Tek bir cloud-only flow (Clerk + relay).** Reddedildi: ev içi kullanıcılar için cloud round-trip latency'si gereksiz; offline-LAN senaryosu (internet kesik ama HA çalışıyor) bütünüyle çalışmaz hale gelir. Self-hoster'lar için cloud bağımlılığı reddedilemez bir kayıp.
- **Seçenek D — Dual-mode auth: local HA OAuth + cloud relay (Clerk) (seçilen).** Karar bölümünde detay.

## Karar

**Glaon iki ayrı auth modunu eş zamanlı destekler. Mod, `AuthMode` discriminated union'ı ile tek bir kontratta soyutlanır; uygulamanın geri kalanı modu yalnızca bu union üzerinden bilir, asla `if (clerk) ... else ...` tarzı dağınık koşul yazmaz.**

Kararın teknik detayları:

### Mod tanımları

- **Local mod (`kind: 'local'`):** İstemci HA WebSocket'ine doğrudan bağlanır ([ADR 0016 DirectWsTransport](0016-ha-ws-transport.md)). Kimlik HA'nın OAuth2 Authorization Code + PKCE akışıyla edinilir (ADR 0005 ile aynı mekanizma — bu ADR sürekliliği koruyor; ADR 0005'i süpersede etme nedeni "tek-yöntem" kuralını kaldırmak, OAuth+PKCE'yi reddetmek değil). Tokenlar `TokenStore`'un `local` slot grubunda yaşar (web in-memory + httpOnly cookie; mobile SecureStore — ayrıntı [#9](https://github.com/toss-cengiz/glaon/issues/9)).
- **Cloud mod (`kind: 'cloud'`):** İstemci Glaon cloud relay'ine bağlanır ([ADR 0018 CloudRelayTransport, planlı](https://github.com/toss-cengiz/glaon/issues/338)); cloud, addon agent üzerinden HA'ya forward eder. Kimlik **Clerk** (kararı [ADR 0019, planlı](https://github.com/toss-cengiz/glaon/issues/339)) ile edinilir; Glaon kullanıcısı Clerk'te login olur, kısa-ömürlü Clerk JWT'siyle relay'i otorize eder. **HA OAuth tokenları cloud'a hiç geçmez** — addon agent kendi local Supervisor token'ı ile HA'ya konuşur. Cloud sadece Clerk identity + relay-secret bilir.

### `AuthMode` discriminated union

```ts
export interface CloudSession {
  readonly token: string; // Identity provider session JWT (provider locked in ADR 0019)
  readonly expiresAt: number; // ms epoch
}

export type AuthMode =
  | { readonly kind: 'local'; readonly tokens: HaAuthTokens }
  | {
      readonly kind: 'cloud';
      readonly session: CloudSession;
      readonly homeId: string;
      readonly relayEndpoint: string;
    };
```

Tip dosyası `packages/core/src/auth/types.ts`. Bu ADR'in code-side teslimi. **Bilinçli karar: cloud session'ı `clerkSession` değil `session` olarak adlandırdık** — IdP seçimi ADR 0019'da bağımsız tartışılıyor; AuthMode tip katmanında IdP-agnostik kalmalı ki bir gün IdP değişirse bu union breaking change olmadan geçişi kaldırabilsin.

### Mod seçimi ve geçişi

- **Mod-per-home invariant:** Bir home için aynı anda yalnızca **bir** mod aktif. Her oturum tek `AuthMode` üzerinde ilerler; UI mod'u gösterir, mod-switcher kullanıcıya sunulur.
- **Mod değiştirme akışı (kritik):**
  1. Mevcut `HaClient.close()` çağrılır — açık WS kapanır, in-flight request'ler reject edilir.
  2. Entity store flush edilir — eski mod'un state delta'sı yeni mod'la karışmamalı.
  3. `TokenStore` ilgili slot grubu temizlenir (`local` slot grubu ↔ `cloud` slot grubu).
  4. Yeni mod'un sign-in akışı başlatılır.
  5. Başarı: `AuthMode` yeni discriminant ile yayılır; HaClient yeni transport ile yeniden bağlanır; entity store yeni `applySnapshot`'tan dolar.
- **Otomatik mod-detect (E2 / G2 — issue #353 / #356):** First-run kullanıcıya seçim sunar (Local vs Cloud). Sonraki run'larda son seçim hatırlanır; opportunistic `glaon.local` probe'u (mDNS, [#350](https://github.com/toss-cengiz/glaon/issues/350)) "evdesin" sinyali verirse local'e geri dönmek bir kullanıcı action'ı olarak önerilir, ama otomatik silent switch **yapılmaz** — kullanıcı kontrolü saklanır.
- **Aynı home, iki mod birden:** Aynı kullanıcı evdeyken local, dışarıdayken cloud kullanabilir. İki mod aynı `homeId`'yi paylaşır; cloud tarafta `homeId` Clerk hesabıyla ilişkili pairing token'ı (ADR 0021) tarafından mint edilir, local tarafta `homeId` istemcide yerel bir UUID olarak yaşar — pairing yapıldıktan sonra istemci ikisini eşler. Detay [ADR 0021 (planlı)](https://github.com/toss-cengiz/glaon/issues/341).

### HA tokenının cloud'da yokluğu (kritik güvenlik kuralı)

- HA OAuth access/refresh tokenları cloud sunucularına **hiçbir koşulda** transit etmez. Cloud relay yalnızca:
  - Clerk identity (JWT'nin `sub`, `homeId` claim'i),
  - Relay secret (addon ↔ cloud paylaşımlı, [ADR 0021](https://github.com/toss-cengiz/glaon/issues/341)),
  - HA WS frame'lerinin opaque `payload`'ı (cloud bunları parse etmez, sadece taşır)
    bilir.
- Bu invariant cloud relay'in (ADR 0018) wire envelope tasarımına direkt yansır: cloud relay HA OAuth alanı için bir slot taşımaz, ki yanlışlıkla pump edilemesin.

### Storage kuralları

`TokenStore` ([#9](https://github.com/toss-cengiz/glaon/issues/9)) üç slot grubu tutar — bu ADR yalnızca AuthMode union'ı tanımlar, slot mekaniği [ADR 0006](0006-token-storage.md)'nın Phase 2 revizyonuyla iniyor:

- `ha-access` — local mod access token (web in-memory; mobile SecureStore).
- `ha-refresh` — local mod refresh token (web httpOnly cookie; mobile SecureStore).
- `cloud-session` — cloud mod IdP session JWT (web in-memory; mobile SecureStore).

Mod-switch slot gruplarının birini bütünüyle temizler; çapraz erişim (cloud token'ı HA WS'e gönderme, vs.) typed compile-time + runtime guard ile engellenir.

### ADR 0005 ile ilişki

ADR 0005 "tek yöntem" kararını süpersede ediyoruz; OAuth2 + PKCE local mod için **hâlâ zorunlu** auth yöntemi. Bu ADR sadece "tek yöntem" varsayımını gevşetiyor. ADR 0005'in OAuth + PKCE detayları (web + mobile redirect, refresh rotation, LLAT yasağı) local mod için aynen geçerli.

## Sonuçlar

### Olumlu

- **İki ürün modeli, tek codebase:** Local-first self-hoster + cloud-first multi-home kullanıcısı aynı `apps/web` / `apps/mobile` build'inden besleniyor; sadece runtime mod farkı.
- **Security model temiz:** HA tokenı asla cloud'a geçmez kuralı tek satırlık invariant — auditing kolay. Compromise senaryolarında "cloud relay ele geçirildi → HA hesapları yandı" zinciri kırık.
- **`AuthMode` union dağınıklığı yok:** Component'ler ve feature'lar `mode.kind` üzerinden discriminate eder; TypeScript exhaustiveness check yeni mod eklenirse her tüketiciyi error olarak yakalar.
- **Self-host için lock-in yok:** Cloud mod opt-in. Self-hoster Clerk hesabı oluşturmadan, addon'u local-only çalıştırarak tüm ürünü kullanabilir.
- **Multi-home, mod-per-home invariant ile tasarlanmış:** Phase 5'in multi-home epic'i (#30) bu ADR'in `homeId` field'i üzerine doğrudan inşa eder; sıfırdan kontrat yazılması gerekmez.

### Olumsuz / ödenecek bedel

- **Test surface iki katı:** Auth ile temas eden her senaryo (login, refresh, logout, mode switch, network kesinti) iki modda da test edilmeli. CI'da `@smoke` E2E suite'i hem local hem cloud için bir senaryo koşar (#13 + #358 + #359).
- **Mod-switch flush expensive:** Entity store + TokenStore + WS kapatma → kullanıcı için mod değiştirme "soğuk başlangıç" hissi verir. UX bu adımı progress göstergesiyle açıkça iletmeli; sessiz yapılmamalı.
- **Cloud bağımlılık riski:** Cloud relay düşerse cloud-mod kullanıcılarının Glaon kullanımı durur. Mitigasyon: kullanıcının tek-tıkla local mod'a düşürebileceği failover; "home-offline" UI banner'ı ([ADR 0018 control frame](https://github.com/toss-cengiz/glaon/issues/338)). HA'nın kendisi çalışmıyorsa zaten her iki mod da etkili olamaz; cloud'un HA'dan ayrı bir failure surface'i olması net iletişim ihtiyacı doğuruyor.
- **IdP lock-in örtük olarak Clerk:** Cloud session token'ı IdP-agnostik tip taşıyor ama pratikte tüm cloud altyapısı Clerk JWKS'i ile authenticate eder ([ADR 0019, planlı](https://github.com/toss-cengiz/glaon/issues/339)). IdP değişimi tip layer'ı değiştirmez ama cloud backend'i + frontend SDK migrasyonu gerektirir.

### Etkileri

- **`@glaon/core` exports:** Yeni `./auth` export'unun `AuthMode` ve `CloudSession` tip içerdiği. `packages/core/src/auth/types.ts` yeni dosya; `packages/core/src/auth/index.ts` re-export ekleniyor.
- **[ADR 0005](0005-oauth2-pkce-only-auth.md)** "Superseded by ADR 0017" header'ı alır (header-only edit; immutability convention gereği body değişmez).
- **[ADR 0006 — Token storage](0006-token-storage.md):** Phase 2 revizyonu (üç slot grubu) [#9](https://github.com/toss-cengiz/glaon/issues/9) PR'ı ile iniyor; ADR 0006 header'ında "Updated for Phase 2 dual-mode auth — see ADR 0017" notu eklenecek (header-only).
- **CLAUDE.md — Security-First Rules:** "No localStorage for tokens" kuralı bu ADR ile cloud mod'a da yayılıyor. CLAUDE.md text'i Phase 2'nin ilerleyen PR'larında genişletilebilir; bu PR scope dışı.
- **Issue body referansları:** Tüm Phase 2 auth ve transport issue'ları (#7, #8, #9, #10, #337'nin kendisi, B/D/E/G/F serileri) bu ADR'a referans verir; merge sonrası gerekli body update'leri yapılır.
- **Cross-link:** ADR 0018 (cloud relay topology), 0019 (Clerk), 0021 (pairing) bu ADR'in `kind: 'cloud'` branch'ini doldurur. Hâlâ yazılmamış oldukları için bu ADR'in detayları onların var olmamasıyla yıkılmıyor; arayüz (`AuthMode`) yeterince soyut.

## Tekrar değerlendirme tetikleyicileri

- HA bir resmi multi-home cloud relay'i yayınlarsa (Nabu Casa'nın multi-tenant versiyonu gibi) — Glaon'un cloud-mod backend'inin (apps/cloud) varlık nedeni daralır; bu ADR yeniden açılır.
- Cloud-mod kullanıcı yüzdesi 6 ay sonunda %5'in altında kalırsa — mod-per-home karmaşıklığını sürdürmeye değer mi sorusu yeniden tartışılır; muhtemelen yine "evet" çıkar (self-hoster + multi-home niş'leri ürünün konumlanmasının özü) ama veriyle sorgulanmalı.
- IdP olarak Clerk değiştirilirse — cloud branch tip imzası `session.token` ile aynı kalır; ADR 0019 yeniden yazılır, bu ADR superseded edilmez.
- HA OAuth modeli kırılırsa — ADR 0005 zaten süpersede, etki ADR 0017'in local branch'ini güncellemekle sınırlı; yeni bir ADR ile değiştirilir.

## Referanslar

- Issue [#337 — dual-mode auth ADR](https://github.com/toss-cengiz/glaon/issues/337) — bu ADR'in tracking issue'su.
- Issue [#338 — cloud relay topology + wire protocol](https://github.com/toss-cengiz/glaon/issues/338) — ADR 0018 (planlı).
- Issue [#339 — identity provider — Clerk](https://github.com/toss-cengiz/glaon/issues/339) — ADR 0019 (planlı).
- Issue [#341 — pairing protocol + relay credentials](https://github.com/toss-cengiz/glaon/issues/341) — ADR 0021 (planlı).
- Issue [#9 — secure token storage](https://github.com/toss-cengiz/glaon/issues/9) — `TokenStore` üç-slot revizyonu bu ADR ile uyumlu inecek.
- [ADR 0005 — OAuth2 PKCE (superseded)](0005-oauth2-pkce-only-auth.md) — local mod hâlâ bu kararın üzerinde duruyor.
- [ADR 0006 — Token storage](0006-token-storage.md) — Phase 2 revizyonu için #9 ile birlikte güncellenecek.
- [ADR 0009 — HA Add-on + Ingress](0009-ha-addon-ingress-delivery.md) — local mod'un addon Ingress senaryosu burada tanımlı.
- [ADR 0016 — HA WS transport](0016-ha-ws-transport.md) — `HaClient` her iki mod'u transport interface arkasında multiplex eder.
- [CLAUDE.md — Security-First Rules](../../CLAUDE.md#security-first-rules) — token saklama + CSP + LLAT yasağı kuralları her iki mod için geçerli.
