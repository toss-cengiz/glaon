# ADR 0018 — Cloud relay topology + wire protocol

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-07
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue #338 (this ADR), issue #345 (B3 — cloud WS relay endpoint), issue #348 (D1 — addon relay agent), issue #10 (HaClient), [ADR 0016 — HA WS transport](0016-ha-ws-transport.md), [ADR 0017 — dual-mode auth](0017-dual-mode-auth.md), [ADR 0019 — Clerk (planlı)](https://github.com/toss-cengiz/glaon/issues/339), [ADR 0021 — pairing (planlı)](https://github.com/toss-cengiz/glaon/issues/341)

## Bağlam

[ADR 0017](0017-dual-mode-auth.md) cloud mode için bir relay backend gerekliliğini belirledi: istemci ev içindeki HA'yı doğrudan göremiyor, Glaon cloud'una WebSocket açıp komut gönderiyor; cloud bu mesajları HA'nın evdeki kopyasına yönlendiriyor. Ama henüz **cloud ile evi nasıl konuştuğumuz** açıkta — bu ADR onu kilitliyor.

Tartışma çerçevesi:

- **Topology:** Cloud HA'ya direkt bağlanamaz — ev tipik olarak NAT arkasında, port forwarding ön kabul olamaz. Yani bağlantı **evden cloud'a outbound** açılmak zorunda. Ev tarafında bu işi kim yapacak?
- **Tek tip mesaj mı, multiplexing mi?** Cloud bir kullanıcı oturumu için bir adet WebSocket açıyor (client side); evdeki addon agent başka bir WebSocket açıyor; cloud bu ikisini eşliyor. Mesaj formatı bunu nasıl ayırt ediyor?
- **HA WS protokolünü cloud parse etsin mi?** Cloud HA'nın WebSocket protokolünü anlayıp filter/policy uygulamak isteyebilir; ama bu cloud'u HA protokol upgrade'lerine bağımlı yapar ve "hızlı geçiş aleti" misyonuna ters düşer.
- **Auth lifecycle:** Cloud relay JWT ile authenticate ediliyor (ADR 0019, Clerk). JWT 1h, ama WS connection saatlerce yaşıyor — JWT döndüğünde WS kopmamalı. Refresh token'ı WS üzerinden mi taşıyacağız?
- **Reconnect + offline:** Ev internet kesilirse client tarafında ne görünür? Cloud state cache'liyor mu yoksa "stale" mi gösteriyor? Privacy + scale boyutları var.
- **HA OAuth tokenları:** ADR 0017'nin kritik invariant'ı — HA tokenları cloud'a hiç geçmez. Bu invariant wire protokol tasarımına nasıl yansıyacak?

Göz önünde bulundurulan alternatifler:

- **Seçenek A — Doğrudan istemci ↔ HA, cloud sadece NAT-traversal (TURN/STUN-style):** Reddedildi. WebRTC veya benzeri P2P çözümler için ev tarafında bir TURN benzeri agent yine gerek; üstüne karmaşık ICE negotiation. Bizim ihtiyaç sadece bir mesaj relay'i; tam P2P stack'i overkill.
- **Seçenek B — HA WS'i raw olarak relay'le (cloud parse etmeden bytestream forward eder):** Reddedildi. WebSocket framing iki taraf da WS olduğunda re-frame gerekiyor — raw byte forward saf TCP gibi davranır, frame boundary'leri bozulur. Per-frame envelope wrap bu sorunu çözüyor.
- **Seçenek C — HA WS protokolünü cloud parse etsin, mesajları HA frame'lerine eşle:** Reddedildi. Cloud HA upgrade'lerine bağımlı olur (yeni `subscribe_*` mesaj tipi geldiğinde cloud güncellenir). Ayrıca filtering policy'sini cloud-side'da yazmak ürünün ilk turunda gereksiz karmaşıklık. Mesajı opaque tutmak hem ileri uyumlu hem operasyonel olarak sade.
- **Seçenek D — Outbound WS from home (addon agent), inbound WS from client, cloud multiplexes by `homeId`+`sessionId`, HA WS opaque payload (seçilen):** Karar bölümünde detay.

## Karar

**Cloud relay topolojisi iki uçlu bir multiplexer olarak donduruluyor:**

```
┌────────────┐  inbound WS    ┌──────────────────┐  outbound WS  ┌──────────────┐
│  client    │ ◄────────────► │  Glaon cloud     │ ◄───────────► │  addon agent │
│  (web/RN)  │  /relay/client │  relay           │  /relay/agent │  (ev içi)    │
└────────────┘                │  multiplexer     │               └──────┬───────┘
                              └──────────────────┘                      │
                                                                        │ Supervisor token
                                                                        ▼
                                                                 ┌──────────────┐
                                                                 │   HA WS API  │
                                                                 └──────────────┘
```

Kararın teknik detayları:

### Bağlantı yönü ve endpoint'ler

- **Addon agent → cloud (`/relay/agent`):** Outbound WS. Ev tarafı NAT arkasında olduğu için bağlantıyı **evden** açıyoruz. Authentication: pairing sırasında mint edilen `relay_secret` (ADR 0021, planlı) HTTP header'ında. Bağlantı koparsa addon agent reconnect döngüsüne girer (exponential backoff).
- **Client → cloud (`/relay/client`):** Inbound WS. İstemci cloud'a kendi açar. Authentication: kısa-ömürlü Clerk JWT (ADR 0019, planlı) `Sec-WebSocket-Protocol` veya `Authorization` header'ında upgrade sırasında.
- **Cloud multiplexing key:** `(homeId, sessionId)` çifti. `homeId` pairing'le mint edilen ev kimliği; `sessionId` her client WS bağlantısı için cloud-tarafı tarafından üretilen UUID. Aynı `homeId`'ye birden fazla client (örn. mobile + web aynı kullanıcı) eş zamanlı bağlanabilir; her biri kendi `sessionId`'siyle ayrı.

### Wire envelope

```ts
// packages/core/src/protocol/relay.ts (bu PR ile iniyor)
export interface RelayEnvelopeBase {
  readonly homeId: string;
  readonly sessionId: string;
  readonly ts: number; // ms epoch — ordering + debugging için
}

export interface RelayHaWsFrameEnvelope extends RelayEnvelopeBase {
  readonly type: 'ha_ws_frame';
  readonly payload: unknown; // HA WS frame, cloud için opaque
}

export type RelayControlFrame =
  | { readonly kind: 'pong' }
  | { readonly kind: 'home_offline'; readonly since: number }
  | { readonly kind: 'session_refresh'; readonly token: string; readonly expiresAt: number }
  | { readonly kind: 'revoked'; readonly reason: string };

export interface RelayControlEnvelope extends RelayEnvelopeBase {
  readonly type: 'control';
  readonly payload: RelayControlFrame;
}

export type RelayEnvelope = RelayHaWsFrameEnvelope | RelayControlEnvelope;
```

Karar:

- Her envelope JSON serialize/deserialize edilir; binary frame Phase 2'de kullanılmıyor (HA WS de JSON).
- `type` field'ı outer discriminant: `ha_ws_frame` (HA-yerli payload taşıyor) vs `control` (Glaon-yerli kontrol mesajı).
- HA WS frame'leri **`payload` içinde aynen**, parse edilmeden taşınır. Cloud relay payload'a bakmaz; sadece `homeId`/`sessionId` rotasyonunu yapar. Bu ileri uyumluluk + privacy seviyesini ayarlar.
- Control frame'leri Glaon-yerli; cloud bunları üretebilir/tüketebilir. Catalogue:
  - `pong`: keep-alive cevabı. Heartbeat client tarafından `ping` (ham WS frame) ile yapılır; cloud `pong` ile cevap verir. Tersi de geçerli (cloud bizden ping isteyebilir).
  - `home_offline { since }`: Cloud agent bağlantısının düştüğünü tespit ettiğinde client'e bildirir. `since` agent'in kopuş zamanı (cloud-tarafı clock).
  - `session_refresh { token, expiresAt }`: Client tarafından cloud'a gönderilir; yenilenmiş Clerk JWT bilgisini taşır. Cloud session'ı bu yeni JWT ile re-authenticate eder, **WS kopmaz**. JWT 1h yaşıyor, refresh ~50dk'da bir push edilir.
  - `revoked { reason }`: Cloud'dan client'a/agent'a; pairing iptal edildi, oturum geçersiz, vs. WS forced-close olur, client tarafında mode-selector'a yönlendirme tetiklenir.

### HA OAuth tokenları cloud'da yok — wire-level invariant

[ADR 0017](0017-dual-mode-auth.md) güvenlik invariant'ı: HA OAuth access/refresh tokenları cloud'a hiç geçmez. Bu envelope tasarımında somutlaşıyor:

- `RelayEnvelopeBase` HA token alanı **taşımıyor** — cloud schema'sında yer yok ki yanlışlıkla pump edilemesin.
- Addon agent kendi local **HA Supervisor token'ı** ile HA WS'ine konuşur (HA add-on'lar için Supervisor zaten bu token'ı runtime-injected env var olarak veriyor). HA tarafı agent'ı kendi user'ı olarak bilmiyor — Supervisor seviyesinde "trusted" addon olarak biliyor.
- Client'in HA oturumuna karşılık gelen şey cloud katmanında **yok**; yetkilendirme Clerk identity'sine bağlı, HA-tarafı kimlik ev içinde Supervisor token'ı tarafından sağlanıyor. Yani "kim hangi HA kullanıcısı?" sorusu cloud'da cevaplanmaz; tüm ev için tek bir Supervisor-level kimlik var. Multi-user HA → multi-user Glaon mapping sorununu Phase 5'in guest mode (#31) epic'i çözecek; bu ADR Phase 2 çıkışı için tek-kullanıcı varsayımıyla çalışır.

### Reconnect + offline davranışı

- **Backoff:** Exponential + jitter, [ADR 0016](0016-ha-ws-transport.md) ile aynı sayılar (`baseDelay=500ms`, `maxDelay=30s`, ±%25 jitter). Client + addon agent ayrı ayrı bu döngüyü çalıştırır.
- **State cache:** Cloud relay HA state'ini **cache'lemez**. Privacy: kullanıcının ev verisi cloud'da kalıcı olarak yaşamasın. Scale: 100k home × ~1000 entity × değişen frequency'de state cache uzun-yaşamlı memory pressure'ı yaratır.
- **Home offline UX:** Addon agent kopar kopmaz (TCP timeout veya ping miss), cloud `home_offline { since }` control frame'ini her aktif client session'ına gönderir. Client entity store'da `staleSince` field'ını set eder ([ADR 0015](0015-state-management.md)); UI banner görünür ("Ev şu an erişilemez. Veriler 2dk öncesine ait."). Reconnect olunca cloud bağlantıyı normalleştirir, client `get_states` snapshot'ı isteyip reconcile eder.
- **In-flight req'ler:** Bağlantı kopması anında client tarafındaki pending HaClient request'leri reject edilir ([ADR 0016](0016-ha-ws-transport.md)). Reconnect sonrası caller (TanStack Query veya HaClient consumer) retry stratejisine bırakılır.

### Session refresh — JWT rotation WS koparmadan

- Client cloud'a bağlanırken short-lived Clerk JWT veriyor; cloud relay session'ı `(homeId, sessionId)` çifti ile track ediyor.
- JWT 1h yaşıyor. Client SDK ~50dk'da bir Clerk SDK üzerinden refresh alır → **`session_refresh` control frame** ile cloud'a push eder.
- Cloud envelope'taki yeni JWT'yi JWKS ile validate eder; pass ederse session metadata'sını günceller. WS kopmaz, in-flight subscription'lar etkilenmez.
- Refresh fail ederse cloud `revoked { reason }` ile session'ı kapatır.

### Backpressure + max-in-flight

- Cloud per-session max in-flight HA WS frame sayısını sınırlar (öneri: 64 outbound, 256 inbound — production'da metrics ile fine-tune).
- Limit aşılırsa cloud client'tan gelen frame'leri **drop etmez**, WebSocket back-pressure mekanizmasıyla (TCP receive window) read'i yavaşlatır → client'in `ws.bufferedAmount` artar → client tarafı kendi mantığında sınırını aşarsa user'a "rate limited" hatası gösterir.
- Bu detay implementasyonun özgürlüğüne bırakılmıştır — ADR yalnız "drop yok, back-pressure var" prensibini donduruyor.

### Test surface

- **Schema conformance:** `packages/core/src/protocol/relay.ts` typed envelope'i tek doğru kaynak. Cloud relay implementasyonu (B3, [#345](https://github.com/toss-cengiz/glaon/issues/345)) ve addon agent (D1, [#348](https://github.com/toss-cengiz/glaon/issues/348)) bu paketi import ederek aynı tipleri kullanır → contract drift derleme zamanında yakalanır.
- **End-to-end:** [#10 HaClient'ın CloudRelayTransport](https://github.com/toss-cengiz/glaon/issues/10) implementasyonu B3 staging'e karşı conformance test'i koşar. Reconnect, control frame round-trip, session_refresh JWT rotation senaryoları E2E'de test edilir.
- **Fake relay:** `@glaon/core` testing utility'si bir fake relay sunar; client unit testleri cloud çalıştırmaya gerek olmadan envelope flow'unu egzersiz edebilir.

## Sonuçlar

### Olumlu

- **HA protokolüne köprü:** Cloud HA WS protokolünü anlamadığı için HA-tarafı upgrade'ler cloud'u etkilemiyor. HA bir gün `subscribe_devices` mesajı eklerse cloud kod değişmez; payload üzerinden geçer.
- **Privacy net:** Cloud HA state'ini saklamaz, parse etmez. Sızıntı riski payload'a değil, sadece envelope metadata'sına (homeId, sessionId, timestamp) düşer — bunlar zaten anonimize tutulur.
- **JWT rotation kesintisiz:** WS bağlantısı uzun-yaşamlı; rotation control frame'i ile yapıldığı için kullanıcı 1 saatte bir login butonu görmez.
- **Multi-client tek ev:** Aynı `homeId` için birden çok session aktif olabilir → mobile + tablet + web aynı anda. Cloud session-bazlı multiplex ediyor.
- **Tip güvenliği:** Wire envelope `@glaon/core` paketinde donduruluyor; istemci, cloud ve agent aynı tipe (TS yoluyla cloud Node.js, agent Python ise — agent'ın stack'i ADR 0021 + D1'in tasarım kararı; tip ayrılığı varsa runtime schema validator zorunlu).

### Olumsuz / ödenecek bedel

- **Cloud cache yokluğu:** Home offline iken client gerçek-zamanlı state göremiyor → UI "stale" olarak gösteriyor. Bazı kullanıcı için bu beklenmedik (Apple Home gibi ürünler offline mode'da local cache gösterebiliyor). Bu trade-off bilinçli — privacy + scale öncelikli.
- **Cloud sıfır-policy:** Cloud HA frame'lerine bakmadığı için içerik filtering / abuse detection cloud-side'da yok. Eğer sonradan abuse vakası çıkarsa filter ekleme = ileri-uyumluluğu kıran değişiklik (cloud frame'leri parse etmeye başlar). Güçlük dengelendi: ürün lansman aşamasında risk düşük.
- **Schema drift riski:** Üç implementasyon (client, cloud, agent) aynı envelope'a bağımlı. TS ortamında shared package import'u korumayı sağlar; agent farklı bir runtime'a (örn. Python add-on) yazılırsa schema validator (Zod, JSON Schema) zorunlu. ADR 0021 + D1'in tasarımında tutulacak.
- **Backpressure default'ları belirsiz:** İlk turda `64/256` öneriydi; production'da prod metrics geldikçe ince ayar gerekecek. Operasyonel risk değil ama observability gerektiriyor.

### Etkileri

- **`@glaon/core` exports:** Yeni `./protocol` export'u eklendi (`packages/core/package.json` exports map'i güncel). `RelayEnvelope`, `RelayControlFrame` tipleri client + cloud + (TS ise) agent tarafından import edilir.
- **Cloud backend (apps/cloud, B-track):** Bu ADR'in zorunlulukları:
  - `/relay/agent` ve `/relay/client` ayrı endpoint'ler.
  - Multiplexing key: `(homeId, sessionId)`.
  - Auth: agent için `relay_secret`, client için Clerk JWT.
  - State cache yasak.
  - Backpressure WebSocket-native.
- **Addon agent (D-track):** Outbound-only WS; HA Supervisor token ile HA'ya konuşur; HA frame'lerini opaque payload olarak relay'e gönderir; control frame'leri parse edip işler.
- **HaClient `CloudRelayTransport` (#10):** [ADR 0016](0016-ha-ws-transport.md) transport interface'ini bu envelope ile implement eder. `HaTransport.send(haFrame)` çağrısında envelope wrap işi transport'ta yapılır; HaClient envelope'i bilmez.
- **CSP:** Web app cloud relay endpoint'ine `wss://` bağlanacak; CSP `connect-src` listesine cloud host'u eklenir. Concrete URL ADR 0020 (hosting) belirleyecek.
- **CLAUDE.md — Security-First Rules:** "HA OAuth tokenları cloud'a transit etmez" invariant'ı bu ADR ile somutlaştı; CLAUDE.md ileride bir Phase 2 hardening turunda update edilecek.

## Tekrar değerlendirme tetikleyicileri

- HA tarafı resmi cloud relay (Nabu Casa multi-tenant) yayınlarsa — ADR 0017'in cloud branch'i ile birlikte bu ADR de yeniden değerlendirilir.
- Cloud abuse vakaları (oran limit aşan client, HA komut spam) ortaya çıkar ve envelope-level filtering zorunlu hale gelirse — yeni ADR; payload artık opaque kalmaz.
- HA WS protokolü binary frame'lere geçerse (örn. CBOR) — envelope binary serialization desteklemeli; bu ADR superseded edilir.
- WebTransport / QUIC tabanlı bir alternatif transport olgunlaşırsa (HTTP/3 push, multistream) — WS yerine geçiş yeni ADR.
- Multi-user HA mapping ihtiyacı doğarsa (Phase 5 guest mode #31) — envelope'a `haUserId` claim eklenir; bu ADR genişletilir, superseded edilmez.

## Referanslar

- Issue [#338 — cloud relay topology + wire protocol](https://github.com/toss-cengiz/glaon/issues/338) — bu ADR'in tracking issue'su.
- Issue [#345 — B3 cloud WS relay endpoint](https://github.com/toss-cengiz/glaon/issues/345) — cloud-side implementasyonu.
- Issue [#348 — D1 addon relay agent](https://github.com/toss-cengiz/glaon/issues/348) — agent-side implementasyonu.
- Issue [#10 — dual-transport HaClient](https://github.com/toss-cengiz/glaon/issues/10) — `CloudRelayTransport` bu ADR'a göre yazılır.
- [ADR 0016 — HA WS transport](0016-ha-ws-transport.md) — `HaTransport` interface'i + reconnect rakamları.
- [ADR 0017 — dual-mode auth](0017-dual-mode-auth.md) — HA tokenı cloud'a geçmez invariant'ı bu ADR'la somutlaşır.
- [ADR 0019 — Clerk (planlı)](https://github.com/toss-cengiz/glaon/issues/339) — client auth IdP.
- [ADR 0021 — pairing + relay credentials (planlı)](https://github.com/toss-cengiz/glaon/issues/341) — `relay_secret` mint + rotation.
- HA Supervisor token: <https://developers.home-assistant.io/docs/api/supervisor/>
- WebSocket back-pressure: <https://www.rfc-editor.org/rfc/rfc6455#section-5.1>
