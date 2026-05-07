# ADR 0016 — HA WebSocket transport mimarisi

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-07
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue #332, #10 (HaClient implementation), #11 (entity state store), #12 (service call API), [ADR 0015 — state management](0015-state-management.md), [ADR 0017 — dual-mode auth (planlanmış)](https://github.com/toss-cengiz/glaon/issues/337), [ADR 0018 — cloud relay topology (planlanmış)](https://github.com/toss-cengiz/glaon/issues/338)

## Bağlam

Home Assistant'ın WebSocket API'si Glaon'un canlı veri yolu. Phase 1'de `packages/core/src/ha/client.ts` yalnızca bir iskelet — handshake yarım, multiplexing yok, reconnect yok. Phase 2'de bu transport iki farklı modda çalışacak ([dual-mode auth ADR'sı, #337](https://github.com/toss-cengiz/glaon/issues/337)):

- **Local mod:** Tarayıcı / Expo doğrudan ev içindeki HA örneğine WebSocket açar.
- **Cloud mod:** Glaon cloud relay'ine WebSocket açar; relay HA add-on agent'ına forward eder ([cloud relay topology, #338](https://github.com/toss-cengiz/glaon/issues/338)).

Her iki yolda **aynı mesaj kontratını** taşımak gerekiyor — `subscribe_entities`, `call_service`, `get_states` gibi HA-yerli komutlar her iki transportta aynı şekilde gönderilebilmeli ki entity store (#11) ve service API (#12) transport-agnostic kalsın.

Phase 0'daki [ROADMAP](../ROADMAP.md#kararlar-ve-açık-sorular) açık soru olarak "WS transport mimarisi" bırakmıştı. Phase 2'nin başında bu mimariyi kilitlemek gerek; çünkü:

- #10 (dual-transport HaClient) iki farklı transport implementasyonunu paralel yazacak; ortak interface'i ADR'in hangi seam'lerini sabitleyeceğine bağlı.
- #11 ve #12 store + service API kontratını HaClient'ın yüzeyine bağımlı tasarlayacak.
- Cloud track ADR'leri (0018 — relay topology, 0021 — pairing) bu transport yüzeyine referans verecek.

Tartışma çerçevesi:

1. **Tek client mı, feature-bazlı çoklu client mı?** Bir oturumda 5 farklı feature `subscribe_entities` çağırırsa 5 ayrı WS mu açılır, yoksa tek bir WS üzerinden subscription multiplexing mi?
2. **Subscription modeli:** HA WS protokolü her message için artan bir `id` kullanıyor; subscription'lar bu id ile keyleniyor. Glaon kendi observer'larını HA `id`'sine mi yoksa Glaon-tarafı bir subscription handle'ına mı bağlamalı?
3. **Reconnect davranışı:** Bağlantı koparsa ne olur? In-flight request'lerin promise'lerine ne olur? Subscription'lar otomatik mi yenilenir? Snapshot reconciliation nerede?
4. **Auth lifecycle:** WS client `auth_invalid` aldığında ne yapar? Token refresh kim tetikler? Cloud transport'ta JWT rotation WS'i kapatmadan nasıl olur?
5. **Test surface:** Bu transport unit, integration ve E2E katmanlarında nasıl mock'lanacak?

Göz önünde bulundurulan alternatifler:

- **Seçenek A — Feature-bazlı çoklu HaClient:** Her feature kendi HA WS'ini açar. Reddedildi: HA'nın tek bağlantı başına resource overhead'i + auth handshake'in her bağlantıda tekrarlanması + pratik bir kazancı yok. Subscription multiplexing zaten HA protokolünün doğal davranışı (her message id farklı, server bunları ayırıyor).
- **Seçenek B — `home-assistant-js-websocket` kütüphanesini kullan:** Reddedildi (yeniden değerlendirme tetikleyicisi olarak açık bırakıldı). Resmi HA frontend bu kütüphaneyi kullanıyor; battle-tested. Ama (a) `@glaon/core` platform-agnostic olmak zorunda ([ADR 0004](0004-glaon-core-platform-agnostic.md)), kütüphane RN uyumluluğu net değil ve hâlâ test edilmedi, (b) cloud relay transport'unu (ADR 0018) bu kütüphane içine sokmak zorlaşıyor — kütüphane "raw HA WS" varsayımıyla yazılmış, relay envelope'unu wrap eden kendi transport adapter'ımıza ihtiyaç var, (c) bağımlılığı tek bir runtime client'a kilitler (kütüphane ekibi cloud relay senaryosunu desteklemez). Hand-rolled implementation'ın komplikasyon bütçesi büyük değil; HA WS protokolü stabil ve dar kapsamlı.
- **Seçenek C — Tek `HaClient` instance + transport interface + multiplexing (seçilen):** Karar bölümünde detay.
- **Seçenek D — Server-Sent Events / polling fallback:** Reddedildi. Sadece WebSocket özelliklerini kullanmak için polling emek-yoğun + HA tarafı SSE sunmuyor. Cloud relay zaten WebSocket; tek transport tipi yeterli.

## Karar

**Glaon'un HA bağlantısı tek bir `HaClient` instance üzerinden, transport interface arkasında multiplex edilir. İki transport implementasyonu (DirectWsTransport, CloudRelayTransport) aynı `HaClient`'a takılır; client transport-agnostic davranır.**

Kararın teknik detayları:

### Sınıf yapısı

```
packages/core/src/ha/
  client.ts        # HaClient — multiplexing, subscription registry, reconnect orchestration
  transport.ts     # HaTransport interface
  transports/
    direct-ws.ts   # DirectWsTransport — raw WS to HA
    cloud-relay.ts # CloudRelayTransport — Glaon envelope to relay (#10 + ADR 0018'de iniyor)
  protocol/
    messages.ts    # HA WS message types (auth, subscribe_entities, call_service, ...)
    relay.ts       # Glaon relay envelope (ADR 0018'de iniyor)
```

`HaClient` constructor'ı bir transport alır; transport'u soyut bilir, üstüne kendi subscription registry'sini, message id correlation'ını ve reconnect logic'ini ekler.

### Transport interface

```ts
interface HaTransport {
  connect(): Promise<void>;
  send(frame: HaOutboundFrame): void; // fire-and-forget; HaClient id correlation yapar
  on(event: 'message', handler: (frame: HaInboundFrame) => void): () => void;
  on(event: 'close', handler: (info: CloseInfo) => void): () => void;
  on(event: 'error', handler: (err: Error) => void): () => void;
  close(): Promise<void>;
}
```

Transport seviyesinde HA `id` correlation **yok** — her transport sadece raw frame ileti taşıyıcısı. Id atama, request/response Promise resolution, subscription routing tamamen `HaClient`'ta.

### Subscription multiplexing

- HA WS protokolü artan integer `id` kullanır; her message bir `id` taşır, response/event aynı `id` ile döner.
- `HaClient` her outbound message'a yeni bir id verir, in-flight request map'inde tutar:

  ```ts
  type PendingRequest = { resolve: (data: unknown) => void; reject: (err: Error) => void };
  const pending = new Map<number, PendingRequest>();
  ```

- Subscription'lar (`subscribe_entities`, `subscribe_events`) için ayrı bir registry:

  ```ts
  type SubscriptionHandle = { id: number; unsubscribe: () => Promise<void> };
  const subscriptions = new Map<number, (event: HaEvent) => void>();
  ```

- Glaon-yüzü API: `client.subscribe(entityIdsOrEvents, callback): SubscriptionHandle` döner. Caller `unsubscribe()` çağırır → client `unsubscribe_events` mesajını HA'ya gönderir, registry'den temizler.

- Yüzlerce concurrent observer için: tek subscription, çoklu callback yerine her caller kendi subscription'ını alır. HA tarafı bu maliyeti taşıyabilir; Glaon tarafında Map<number, ...> O(1) lookup. Optimizasyon (örn. aynı target için subscription paylaşımı) ölçüm sonrası, ihtiyaç doğmadan yapılmaz.

### Reconnect davranışı

- **Backoff:** Exponential + jitter — `min(baseDelay * 2 ** attempt, maxDelay)` ± random %25. `baseDelay = 500ms`, `maxDelay = 30s`.
- **Max attempts:** Yok (sürekli dener). Kullanıcı manuel olarak "Sign out" derse client `close()` çağrılır ve döngü iptal edilir.
- **In-flight requests:** Bağlantı koptuğu anda pending Map'teki tüm Promise'lar `HaConnectionLostError` ile reject edilir. Caller (genelde TanStack Query veya `callService`) bu hatayı görüp retry stratejisine girer.
- **Subscription replay:** Yeniden bağlandıktan sonra `HaClient` tüm aktif subscription'ları otomatik resubscribe eder; yeni HA `id`'leri eski Glaon-tarafı handle'lara remap edilir → caller'lar aynı `unsubscribe` referansını kullanmaya devam eder.
- **Snapshot reconciliation:** Reconnect başarılı olduktan sonra client otomatik bir `get_states` çağırır → snapshot entity store'a `applySnapshot()` ile yazılır → store eski `state_changed` event'leriyle delta birikmiş olabilir, snapshot otorite olur (uçtan uca durum). Snapshot reconciliation'ın store-side detayı [ADR 0015](0015-state-management.md) ile #11'de bağlanır.
- **Online/offline UX hook:** Client `connectionState: 'connecting' | 'open' | 'closed' | 'reconnecting'` değerini yayınlar; UI banner'ları bu state'e bağlanır. Implementation #11/#12 ile birlikte iner.

### Auth lifecycle

- **Local mod (DirectWsTransport):** HA `auth_required` mesajı geldiğinde, HaClient `getAccessToken()` callback'ini çağırır → token'ı `auth` mesajıyla gönderir. `auth_ok` → ready. `auth_invalid` → TokenStore'dan refresh isteği yapılır (mutex'li, [#9](https://github.com/toss-cengiz/glaon/issues/9) gereği), yeni access token ile aynı WS üzerinde bir kez daha `auth` denenir; tekrar başarısızsa client `closed` state'e girer ve mode selector'a (E2 / G2) yönlendirme sinyali yayınlar.
- **Cloud mod (CloudRelayTransport):** Cloud relay Clerk JWT ile WS upgrade'i authenticate eder ([ADR 0018, planlanmış](https://github.com/toss-cengiz/glaon/issues/338)). Mid-session JWT rotation control frame (`session_refresh`) ile yapılır — WS kopmaz. HA-tarafı auth tokenları cloud'a hiç ulaşmaz; addon agent kendi HA Supervisor token'ı ile local HA'ya konuşur.
- **Token refresh çakışması:** Birden çok concurrent request token expire olduğunu görürse `auth_invalid` mesajı bir tane gelir; HaClient bunu tek bir refresh task'a kanalize eder ([#9](https://github.com/toss-cengiz/glaon/issues/9) TokenStore mutex). Refresh sırasında gelen yeni request'ler refresh tamamlanana kadar bekler.

### Message id correlation stratejisi

- Client startup'ta `nextId = 1`. Her outbound request öncesinde `nextId++`.
- Reconnect sonrası id sayacı **reset edilir** çünkü HA tarafı yeni bağlantı için id space'ini sıfırlar. Eski subscription'ların Glaon-tarafı handle'ları aynı kalır; sadece HA-tarafı id'leri yeni `subscribe_*` cevaplarından okunup map'e yazılır.
- Outbound mesaj log formatında her zaman `id` görülür → debugging'de event ↔ request eşleştirmesi mümkün.

### Test surface

- **Unit (`packages/core`):** Fake `HaTransport` implementasyonu — scripted frame stream. HaClient'a frame inject edip pending Promise resolve'unu, subscription routing'ini, reconnect snapshot replay'ini assert ederiz.
- **Integration (`apps/web-e2e` / mobile):** Gerçek HA fixture (Docker, [#331](https://github.com/toss-cengiz/glaon/issues/331)) ile E2E [#13](https://github.com/toss-cengiz/glaon/issues/13). Test reconnect behavior'unu HA container'ı kapatıp açarak kontrol eder.
- **Storybook decorator:** Story-level fake HaClient (vanilla store ile beslenmiş) sayesinde component'ler storybook'ta WS gerektirmez. CLAUDE.md Component Data-Fetching Boundary kuralı zaten component'ten fetch'i yasaklıyor — story decorator yalnız store'u dolduruyor.

## Sonuçlar

### Olumlu

- **Tek bağlantı, paylaşılan handshake:** Auth handshake oturum başına bir kez. Mobile data plan için tasarruf, server-side resource için saygı.
- **Transport-agnostic core:** `HaClient` kodu DirectWsTransport ile CloudRelayTransport arasında değişmiyor → store ve service API tek codebase, iki mod.
- **Test ergonomi:** Fake transport ile birim testler hızlı ve deterministik. Reconnect senaryolarını gerçek WS açmadan tetiklemek mümkün.
- **HA protokolüyle uyum:** id correlation HA'nın doğal modeliyle eşleşiyor; ekstra çeviri katmanı yok. HA frontend ile aynı mental model — debugging için ekibe avantaj.
- **Cloud relay paralel implementasyonu:** Transport interface stabil olduğu için B3 (#345 — cloud WS endpoint) ve D1 (#348 — addon relay agent) implementasyonu HaClient'ın iç değişikliklerine bağlı değil; ayrı PR'larda paralel ilerleyebilir.

### Olumsuz / ödenecek bedel

- **Hand-rolled WS client:** `home-assistant-js-websocket`'i kullanmadığımız için handshake, reconnect ve subscription registry'sini biz yazıyoruz. Edge case'ler (auth race, half-open WS, rapid disconnect) test surface'inin kapsamına bağlı olarak sürünebilir; ilk turda bilinen tüm senaryolar unit testle korunur, gerisi production'da gözlemlenir.
- **Subscription registry sprawl:** Yüzlerce caller'ın aynı entity'ye subscribe olduğu bir UI varsa, HA tarafına yüzlerce subscription gönderiyoruz. Sharing optimizasyonu yapmadık — ihtiyaç ölçülürse bir overlay registry eklenir, bu ADR re-değerlendirilmez.
- **Snapshot reconciliation maliyeti:** Her reconnect bir `get_states` round-trip + büyük bir state replace. Yoğun evlerde bu birkaç yüz KB transfer + entity store re-render dalgası. Daha akıllı bir delta diff yapısı (sadece değişen entity'leri reconcile etmek) ileriki bir optimizasyon konusu — şimdi gereksiz karmaşıklık.
- **Cloud relay control frame'lerinin ham WS üzerinde geçmemesi:** CloudRelayTransport `ha_ws_frame` ve `control` envelope'larını ayırt etmek zorunda. Bu envelope tasarımı [ADR 0018'de](https://github.com/toss-cengiz/glaon/issues/338) iniyor; bu ADR yalnız transport interface'inin ikinci implementasyonu olduğunu söyler, envelope detayı oraya bırakılır.

### Etkileri

- **Kod organizasyonu:** `packages/core/src/ha/` mevcut iskeleti yeni dosyalara genişler; mevcut `client.ts` placeholder #10'da yeniden yazılır.
- **CI / build:** Yeni runtime bağımlılığı yok (WebSocket browser ve RN'de native; Node ortamında `ws` peer Phase 2'nin entegrasyon test ortamı için eklenebilir, vitest kapsamında değerlendirilir).
- **`@glaon/core` exports:** `./ha` zaten export ediliyor; transport interface ve fake helper test utility'leri olarak ayrı path (`./ha/testing` gibi) export edilir — production bundle'a girmesin.
- **Mobile (`apps/mobile`):** RN runtime'ı hem WebSocket hem `Map`/`Promise` API'lerini destekliyor; ek polyfill yok. New architecture (RN 0.81 + Hermes) bu kodla uyumlu.
- **Cloud relay decisions:** [ADR 0018, 0019, 0020, 0021, 0022](https://github.com/toss-cengiz/glaon/issues/338) bu transport interface'ini "stabil" varsayar; kontrat değişimi onları etkilerse breaking change olarak ele alınır (ADR superseded edilir, eski 0016 kalır).

## Tekrar değerlendirme tetikleyicileri

- HA topluluğu `home-assistant-js-websocket`'in modern bir RN-uyumlu sürümünü yayınlar veya HA bir resmi typed client publish ederse — hand-rolled client'tan kütüphaneye geçiş değerlendirilir; bu ADR superseded edilir.
- HA WS protokolünde breaking değişiklik olursa (örn. id correlation modeli değişirse) — yeni ADR; bu kalır arşiv olarak.
- Reconnect snapshot reconciliation'ın production'da unacceptable performance dalgası yarattığı ölçülürse (saniyelerce frozen UI) — delta-only reconciliation tasarımı ayrı bir ADR olarak girer.
- Cloud relay endpoint'i transport interface'ini (örn. unidirectional event stream + ayrı request channel) zorunlu kılarsa — interface re-tasarımı yeni bir ADR.

## Referanslar

- Issue [#332 — state management + HA transport architecture decision](https://github.com/toss-cengiz/glaon/issues/332).
- Issue [#10 — feat(core): dual-transport HaClient — direct + cloud relay](https://github.com/toss-cengiz/glaon/issues/10) — bu ADR'in implementasyonu.
- Issue [#11 — entity state store](https://github.com/toss-cengiz/glaon/issues/11) — store ↔ transport sınırı bu ADR'in 4. ve 5. seam'lerinde.
- Issue [#12 — service call API](https://github.com/toss-cengiz/glaon/issues/12) — service helper'lar HaClient yüzeyini consume eder.
- Issue [#9 — secure token storage](https://github.com/toss-cengiz/glaon/issues/9) — auth lifecycle TokenStore mutex'iyle çalışır.
- [ADR 0004 — `@glaon/core` platform-agnostic](0004-glaon-core-platform-agnostic.md) — vanilla / no-DOM kuralı.
- [ADR 0015 — state management](0015-state-management.md) — entity store'un Zustand vanilla store olması bu transport'la birlikte sürdürülebilir.
- HA WebSocket API: <https://developers.home-assistant.io/docs/api/websocket>.
- `home-assistant-js-websocket` (alternatif olarak değerlendirildi): <https://github.com/home-assistant/home-assistant-js-websocket>.
