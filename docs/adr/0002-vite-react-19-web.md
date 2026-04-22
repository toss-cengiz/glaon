# ADR 0002 — Vite + React 19 (web)

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-20
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [CLAUDE.md — Stack](../../CLAUDE.md#stack), [docs/ARCHITECTURE.md](../ARCHITECTURE.md)

## Bağlam

Glaon'un web tarafı iki farklı bağlamda çalışıyor:

1. Home Assistant Add-on olarak **Ingress** üzerinden servis edilen panel (tablet + tarayıcı).
2. İlerleyen sürümlerde doğrudan HA kullanıcılarının tarayıcıdan ulaşabileceği standalone kiosk modu (tablet için tam ekran).

Her iki senaryo da **SSR ihtiyacı duymuyor**: HA kullanıcıları auth'lu (HA session cookie ile Ingress), sayfa indeks SEO ihtiyacı yok, edge caching gerek yok. Ihtiyaç duyulan şey SPA: istemci tarafı render, fast HMR, küçük bundle, CSP-dostu asset yolları.

Değerlendirilen seçenekler:

- **Next.js 15 (App Router):** Full-stack framework. SSR, RSC, edge runtime desteği var. Dezavantaj: Add-on Ingress dinamik URL prefix kullanıyor, Next'in file-system routing ve base path hesabı bu akışla iyi oynamıyor; RSC zaten kullanılmayacak; build output SPA için olandan ağır.
- **Remix:** SSR-first, data loader felsefesi. Aynı SSR gerek-duymuyor sorunu, ek olarak HA Auth akışıyla loader pattern'i paralel geçiyor ama fazla abstraction.
- **Create React App:** Topluluk artık bakım yapmıyor, önerilmiyor.
- **Vite + React:** Pure SPA, sıfır SSR overhead, HMR elit düzeyde, Rollup tabanlı production build küçük bundle veriyor, `--base=./` ile relative asset paths HA Ingress dinamik prefix'ine uyuyor.
- **Parcel:** Konfigürasyonsuz avantajı cazip ama plugin ekosistemi Vite'a göre ince, Sentry + MDX gibi eklentilerde sapma çıkıyor.

React sürümü için React 19 tercih edildi; hem yeni API'lerin (Actions, `use()` hook, optimistic updates) Home Assistant state senkronizasyonunda işe yarayacağı, hem React 18'in end-of-life ufukta olduğu için.

TypeScript strict mode zorunlu — CLAUDE.md güvenlik kuralları (`any` yasak, `ts-ignore` yorumsuz yasak) zaten bunu dayatıyor.

## Karar

Web uygulaması **Vite 6 + React 19 + TypeScript strict** üzerine kurulur.

- `apps/web` paketi Vite ile build'lenir. Production build `vite build`, dev mode `vite`.
- HA Add-on build akışı `vite build --base=./` ile relative asset paths üretir (Ingress'in değişken URL prefix'iyle çalışmak için zorunlu).
- React 19'un concurrent mode özellikleri ve Suspense tabanlı data fetching varsayılan.
- TypeScript 5.7+ strict mode, `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` açık.
- Routing için React Router (client-side). SSR gerekirse ADR yeniden açılır.

## Sonuçlar

### Olumlu

- Dev döngüsü hızlı: Vite HMR sub-100ms.
- Bundle boyutu kontrol altında; Rollup tree-shaking + code splitting istenildiği gibi çalışıyor.
- HA Ingress prefix sorunu `--base=./` ile çözüldü, ek adaptör gerekmedi.
- React 19 Actions API HA service call orkestrasyonunda pattern olarak kullanılabilir.

### Olumsuz / ödenecek bedel

- SSR/RSC yolu gelecekte seçilirse ayrı bir framework'e geçiş gerekecek. Olasılık düşük ama lock-in kabul edildi.
- Vite'ın Rollup bağımlılığı zaman zaman plugin API kırılması yaşatıyor (örn. Sentry plugin major bump'ları).
- React 19'un ecosystem uyumu hâlâ olgunlaşıyor; bazı kütüphaneler 19 peer dep listesinde yok (şimdilik `--legacy-peer-deps` veya workspace override ile çözülüyor).

### Etkileri

- Add-on build pipeline'ı `pnpm --filter @glaon/web build:addon` → `addon/dist/` kopyasıyla standart hale geldi.
- Vite dev server 5173 portunda; devcontainer forward edilen port listesine eklendi (bkz. #103).
- CSP `script-src 'self'` sıkı; Vite'ın `unsafe-inline` ihtiyacı yok (Rollup build'de modül etiketleri self-hosted).

## Tekrar değerlendirme tetikleyicileri

- Sayfa SEO veya non-authenticated public landing gerekirse (SSR zorunluluğu doğar).
- Tablet cihazlarda Vite dev/preview sunucu yerine edge-rendered içerik ihtiyacı çıkarsa.
- React 20 veya Vite 7 breaking change'leri framework geçişini zaten tetikleyecek düzeyde olursa.

## Referanslar

- [Vite docs](https://vitejs.dev)
- [React 19 release notes](https://react.dev/blog/2024/12/05/react-19)
- [docs/ARCHITECTURE.md](../ARCHITECTURE.md)
