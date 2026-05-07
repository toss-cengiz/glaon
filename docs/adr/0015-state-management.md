# ADR 0015 — State yönetimi: Zustand + Immer (client state) + TanStack Query (server state)

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-07
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue #332, #10 (HaClient), #11 (entity state store), #12 (service call API), [ADR 0004 — `@glaon/core` platform-agnostic](0004-glaon-core-platform-agnostic.md), [CLAUDE.md — Component Data-Fetching Boundary](../../CLAUDE.md#component-data-fetching-boundary-mandatory)

## Bağlam

Phase 2 ile birlikte Glaon'un state surface'i somutlaşıyor:

- **Server state (HA-canlı):** Home Assistant WebSocket'i `state_changed` event'lerini saniyede 10–100+ adet basabilir (yoğun bir evde). Bu state Glaon'a "ait" değil — HA'nın sahip olduğu canlı veriyi ekrana yansıtan, push-stream tabanlı bir mirror.
- **Server state (HA-dışı):** `apps/api`'den (epic #392) gelen kullanıcı tercihleri, dashboard layout'ları gibi REST üzerinden çekilen, cache + invalidation gerektiren conventional REST veri.
- **Client state:** UI navigation durumu, optimistic update'lerin local kopyası, pairing wizard'ı gibi multi-step akışların geçici state'i.

Phase 0'da [ROADMAP](../ROADMAP.md#kararlar-ve-açık-sorular) bölümünde "zustand mı, redux-toolkit mi?" sorusu açık bırakılmıştı. Phase 2'nin başında bu kararı kilitlemek gerekli; çünkü #11 (entity state store) ve #12 (service call API) implementasyonu seçilen kütüphanenin store + selector idiomlarına göre yazılacak.

[CLAUDE.md — Component Data-Fetching Boundary](../../CLAUDE.md#component-data-fetching-boundary-mandatory) zaten **server state'in TanStack Query üzerinden feature layer'da yönetilmesini** zorunlu kılıyor; UI component'leri data fetch etmiyor. Bu kural verili. Bu ADR client state ve push-stream tabanlı server state için bir kütüphane seçimi yapıyor; TanStack Query kararı re-litige edilmiyor, yalnızca kapsamı netleştiriliyor.

`@glaon/core` paketi [ADR 0004](0004-glaon-core-platform-agnostic.md) gereği DOM'a ve React Native runtime'ına bağımsız olmak zorunda; entity state store burada yaşıyor → seçilen kütüphane vanilla (React-bağımsız) bir API sunmalı.

Göz önünde bulundurulan alternatifler:

- **Seçenek A — Redux Toolkit (RTK Query olmadan):** Reddedildi. RTK'nın değer önerisinin büyük kısmı RTK Query'dir; biz server state için TanStack Query'yi kilitlemiş durumdayız (CLAUDE.md). RTK Query olmadan, kalan slice/thunk ergonomisi Zustand'ın `set` çağrılarıyla zaten ifade edilebiliyor — net dezavantaj olarak ekstra bundle (~12 KB minified+gzipped, vs Zustand'ın ~1 KB'i) ve action/reducer/middleware ceremony'si kalıyor.
- **Seçenek B — Redux Toolkit + RTK Query (TanStack Query yerine):** Reddedildi. Bu seçim CLAUDE.md'in data-fetching boundary kuralını yeniden yazmayı, mobile'da (RN) TanStack Query yerine RTK Query kullanmayı, ve `apps/api` client'ını da RTK Query baseQuery'sine yeniden yazmayı gerektirirdi. TanStack Query halihazırda hem web hem RN'de iyi çalışıyor; cache, retry, refetch, optimistic update story'si zaten oturmuş. Migrasyon maliyeti yüksek, kazanç yok.
- **Seçenek C — Jotai / Valtio / signal-tabanlı (signia, @preact/signals-react):** Reddedildi. Atom-based veya signal-based modeller HA WS push stream'i için gayet uygun ama (a) ekosistem küçük, (b) RN entegrasyonu Zustand kadar olgun değil, (c) `@glaon/core`'da React-bağımsız vanilla store kullanmak için ek wrapper yazılması gerekiyor. Zustand "boring-but-proven" pick.
- **Seçenek D — Vanilla `useSyncExternalStore` + el ile WS subscriber:** Reddedildi. Zustand'ın sunduğunu daha kötü yeniden yazmak olur. `useSyncExternalStore` zaten Zustand'ın React adapter'ının altında; biz onu kendi elimizle wrap etmek yerine kütüphaneyi getiriyoruz.
- **Seçenek E — Zustand + Immer (client state) + TanStack Query (server state) (seçilen):** Karar bölümünde detay.

## Karar

**Glaon'un state mimarisi üç katman olarak donduruluyor:**

1. **Server state — push stream (HA WebSocket):** `@glaon/core` içinde **Zustand vanilla store** + **Immer middleware** ile yönetilir. Entity store (#11) bu kategoride; HA `state_changed` event'leri Immer üzerinden in-place mutate ediliyor gibi görünen, altında immutable update üreten kod ile uygulanır.
2. **Server state — REST (HA-dışı, `apps/api`):** Feature layer'da **TanStack Query** ile yönetilir. CLAUDE.md Component Data-Fetching Boundary kuralı geçerli; component'ler `useQuery` çağırmaz, hook feature klasöründe yaşar, sonuç prop olarak akar.
3. **Client state:** UI'a yakın geçici state'ler (modal açık/kapalı, multi-step wizard adımı, optimistic patch'in local snapshot'ı) yine **Zustand** ile, ama feature klasöründe — `@glaon/core`'da değil. Trivial state için `useState` kalmaya devam eder; Zustand sadece birden fazla component'in paylaştığı veya cross-tree erişim gereken state için.

Kararın teknik detayları:

- **Zustand sürümü:** `zustand` package'ı, `zustand/middleware/immer` ile birlikte. Pinning Renovate'in normal bump akışına bırakılır.
- **Slice-per-file konvansiyonu:** Her domain bir dosyada — `packages/core/src/state/entities.ts`, `packages/core/src/state/connection.ts`, vs. Tek bir devasa store yok; her slice kendi `create()` çağrısını yapar.
- **Selector-only subscription kuralı:** Component'ler `useStore(state => state.someSlice)` veya `useStore()` (tüm tree'yi return) yazmaz. Her erişim bir **selector** üzerinden gider: `useEntity(id)`, `useEntitiesByDomain(domain)` gibi typed helper'lar slice dosyasında export edilir; component yalnızca bu helper'ı çağırır. Amaç: re-render granülerliği + API kontratı.
- **ESLint kuralı:** Selector-only kuralı ESLint custom rule ile zorlanır. **Bu ADR sadece kuralı kararlaştırır;** rule'un implementasyonu (paket adı, custom rule mu yoksa `no-restricted-imports` ile kombinasyon mu) #11 ile birlikte iner — ADR ile aynı PR'da değil, çünkü kural ancak store dosyaları varken anlamlı.
- **Vanilla store / React store ayrımı:** `@glaon/core` slice'ları **vanilla** Zustand store olarak (createStore, React-free) yazılır; React adapter (`useStore` hook'u) `apps/web` ve `apps/mobile` tarafında bu vanilla store'u sarmalar. Bu sayede `@glaon/core` unit testleri React render gerektirmez, hot Vitest çalışır; aynı core hem web hem RN'den import edilebilir ([ADR 0004](0004-glaon-core-platform-agnostic.md)).
- **Immer kullanım skobu:** Yalnız entity store gibi nested update gerektiren slice'lar Immer middleware ile sarılır. Trivial slice'lar (örn. connection durumu enum) Immer overhead'ine girmez.
- **TanStack Query versiyon devamlılığı:** TanStack Query zaten `apps/web` ve `apps/mobile` planında; kullanım kuralları (queryKey naming, stale time defaults) #392 epic'inin ileri sub-issue'larında kararlaştırılır, bu ADR'in dışında.

## Sonuçlar

### Olumlu

- **Push-stream uyumu:** Zustand'ın selector-tabanlı subscription'ı saniyede 100+ event'lik HA stream'inde yalnızca o entity'yi izleyen component'leri re-render eder. RTK + memoized selector ile aynı seviye granülerliği elde etmek için her event normalize → reducer → memoization katmanını geçer; Zustand'da bu katmanlar yok.
- **Bundle bütçesi:** `apps/web` HA Add-on Ingress üzerinden statik bundle olarak teslim edildiği ([ADR 0009](0009-ha-addon-ingress-delivery.md)) için bundle KB başına önemli — ~11 KB tasarruf (RTK karşısında) küçük ama kümülatif.
- **`@glaon/core` saflığı:** Vanilla Zustand store React-free; [ADR 0004](0004-glaon-core-platform-agnostic.md)'ın platform-agnostic kuralını koruyor. Mobile (Expo, RN 0.81) aynı slice dosyasını import ediyor.
- **Test ergonomisi:** Vitest unit testlerinde fake transport + scripted frame'lerle store'a doğrudan event akıtılıp selector çıktısı assert edilebilir; React test utility gerektirmez.
- **Üç ayrı runtime için tek mental model:** "Push-stream ise Zustand, REST ise TanStack Query" basit bir kural — yeni geliştirici cheatsheet'i bir cümle.

### Olumsuz / ödenecek bedel

- **Konvansiyon yükü:** Zustand "building blocks, not conventions" sunar; store sprawl (her component'in kendi store'unu yazması, selector helper'ları olmadan raw subscribe etmesi) ekiple birlikte ortaya çıkabilen risk. Mitigasyon: slice-per-file kuralı + selector-only ESLint rule + code review'da raw `useStore()` reddi.
- **DevTools kapsamı:** Redux DevTools ekosistemi RTK'da çok zengin; Zustand DevTools middleware'i var ama time-travel debugging ve action replay deneyimi RTK kadar olgun değil. Phase 2'de yaşanmadıkça bu eksiklik küçük; gerekirse Zustand'ın kendi DevTools middleware'ı entegre edilir.
- **Server state'i Zustand'a kaçırma cazibesi:** TanStack Query yerine "bir slice yazıp REST cevabını oraya basayım" eğilimi olabilir. CLAUDE.md kuralı + code review bu sapmayı yakalar; tekrarlanan ihlaller görülürse ek bir ESLint rule (örn. `no-fetch-in-store-slice`) eklenir.
- **Optimistic update ergonomi:** TanStack Query'nin `useMutation` + `onMutate` rollback story'si oturuyor ama push-stream tarafında entity store ile mutation arasındaki sync (örn. `light.toggle` → optimistic Zustand update → HA WS confirms via `state_changed` → optimistic patch'in temizlenmesi) #12'nin tasarım yüküne giriyor. Bu ADR'in çözmediği, #12'nin çözeceği bir konu.

### Etkileri

- **Kod organizasyonu:** `packages/core/src/state/` yeni dizin; `entities.ts`, `connection.ts`, vb. slice dosyaları. `packages/core/src/index.ts` selector'ları re-export eder; raw `useStore` export edilmez (kapı kapalı).
- **Bağımlılık:** `packages/core/package.json`'a `zustand` ve `immer` runtime dep olarak eklenir. TanStack Query zaten `apps/web` ve `apps/mobile`'da kullanılıyor / kullanılacak; `@glaon/core` bu kütüphaneye bağımlı **değil** (server state core'da değil).
- **Test setup:** `vitest.config.ts` ek bir setup gerektirmiyor; Zustand vanilla store Node ortamında zaten çalışıyor.
- **Mobile (`apps/mobile`):** Aynı core slice'larını import ediyor; React adapter `apps/mobile/src/hooks/use-store.ts` gibi bir wrapper olarak yazılıyor (web'de aynı pattern). RN'de side effect yok.
- **Storybook:** `@glaon/ui` story'leri component-level state için ayrı bir Zustand store yaratmıyor; mock'lar prop olarak (CLAUDE.md Component Data-Fetching Boundary) geliyor. State decorator gerekirse story-level oluşturulur, global store'a değdirilmez.

## Tekrar değerlendirme tetikleyicileri

- Zustand'ın React 19+ veya RN new architecture ile uyumsuzluğu ortaya çıkarsa (örn. Concurrent Mode ile selector subscription'ında race) — alternatif aday Jotai veya `@preact/signals-react`.
- TanStack Query kararı CLAUDE.md'den çıkarılır veya `apps/api` farklı bir client (tRPC, gRPC-web) kullanmaya zorlanırsa — server state stratejisi yeniden açılır; bu ADR'in client state kararı (Zustand) etkilenmez.
- Store sprawl problemi 2 quarter'dan uzun süre code review'da yakalanmaya devam ederse — daha opinionated bir framework (Redux Toolkit, Effector) yeniden masaya gelir.
- HA WS event volume'u öyle bir noktaya gelir ki Zustand selector overhead'i ölçülebilir performance sorunu yaratır — entity store'un altında düşük seviye bir push-stream primitive'i (RxJS, signals) ile decouple edilmesi araştırılır.

## Referanslar

- Issue [#332 — state management + HA transport architecture decision](https://github.com/toss-cengiz/glaon/issues/332).
- Issue [#11 — entity state store](https://github.com/toss-cengiz/glaon/issues/11) — bu ADR'in ilk implementasyon noktası.
- Issue [#12 — service call API](https://github.com/toss-cengiz/glaon/issues/12) — optimistic update story store ile birlikte tasarlanır.
- [ADR 0004 — `@glaon/core` platform-agnostic](0004-glaon-core-platform-agnostic.md) — vanilla store kararının arkasındaki ana kısıt.
- [CLAUDE.md — Component Data-Fetching Boundary](../../CLAUDE.md#component-data-fetching-boundary-mandatory) — TanStack Query kuralının tek kaynağı.
- [docs/ROADMAP.md](../ROADMAP.md) — Phase 2 başlangıcında bu açık soru kapatılıyor.
- Zustand: <https://github.com/pmndrs/zustand>
- Immer: <https://immerjs.github.io/immer/>
- TanStack Query: <https://tanstack.com/query>
