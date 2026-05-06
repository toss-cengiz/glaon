# ADR 0014 — `apps/api` ayrı backend service (Next.js geçişi yerine)

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-06
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** epic #392, sub-issue #393, [ADR 0002](0002-vite-react-19-web.md), [ADR 0009](0009-ha-addon-ingress-delivery.md), [CLAUDE.md — Stack](../../CLAUDE.md#stack)

## Bağlam

Phase 1 (`@glaon/ui` foundations) tamamlanma aşamasında. Phase 2 ile birlikte, Home Assistant'ın hostlayamayacağı veriler gündeme geliyor:

- HA kurulumunu / cihazını yeniden kurmaktan etkilenmemesi gereken kullanıcı tercih ve yapılandırmaları.
- Özel dashboard layout'ları, kayıtlı görünümler, cihaz grupları.
- Audit log'ları, kullanım analitiği, push abonelikleri.
- İlerideki paylaşımlı alan / multi-home senaryoları (state tek bir HA örneğinde tutulamaz).

HA dışında kalıcı bir storage gerek; seçilen depo MongoDB (document-shaped veri, hızlı iterasyon, self-hoster için Atlas free tier ulaşılabilir). MongoDB driver'ı tarayıcıdan doğrudan kullanılamayacağı için, server tarafında bu bağlantıyı yönetecek bir runtime şart.

[ADR 0002](0002-vite-react-19-web.md) web uygulamasını Vite + React 19 olarak donduruyor; [ADR 0009](0009-ha-addon-ingress-delivery.md) ise birincil teslim kanalını HA Add-on + Ingress (statik bundle, nginx üzerinden) olarak donduruyor. Phase 2'nin storage ihtiyacı bu iki kararla nasıl kesişeceğini tartıştığımız nokta.

Değerlendirilen seçenekler:

- **Seçenek A — `apps/web`'i Next.js'e taşımak.** App Router + server actions ile MongoDB driver'ını aynı codebase'de kullanma. Reddedildi: HA Add-on packaging'i statik nginx serve üzerine kurulu; Next.js production runtime'ı Node server gerektiriyor → addon Dockerfile, port forwarding ve Ingress reverse-proxy yeniden tasarlanmak zorunda. Phase 1'in Vite + Storybook + Chromatic + Figma plugin pipeline'ı `apps/web`'in Vite app olduğunu varsayıyor; geçiş CI'da geniş bir dalgalanma yaratır. Asıl kazanç sadece "server tarafında Mongo client'ım olsun" ihtiyacı için orantısız.
- **Seçenek B — Mongo'yu HA'nın içine yerleştirmek (custom integration veya HA add-on database).** Reddedildi: HA topluluğu single-instance kullanım için bile bu yaklaşımı uyarıyor; multi-home senaryosunu engelleyici. HA reinstall'da veri kaybı (Phase 2'nin temel motivasyonu) çözülmemiş kalıyor.
- **Seçenek C — Web app'i Vite olarak bırak, ayrı bir `apps/api` backend service ekle (seçilen).** Karar bölümünde detaylanıyor.
- **Seçenek D — Mongo'yu serverless function'lar üzerinden (Vercel/Netlify Functions, Cloudflare Workers) aç.** Reddedildi: HA Add-on senaryosu için her iki tarafı (Add-on + cloud function) tutmak zorunlu; self-host önceliği olan bir kullanıcı için cloud function bağımlılığı lock-in yaratır. `apps/api` aynı kodu hem Add-on sidecar hem hosted servis olarak çalıştırabilir, esnekliği koruyor.

## Karar

**Phase 2'de yeni bir workspace paketi ekleniyor: `apps/api/` — MongoDB bağlantısını sahiplenen, web ve mobile'a tipli REST/JSON endpoint'leri sunan bir backend service. `apps/web` Vite + React olarak kalacak; Next.js'e geçilmiyor.**

Karar'ın çerçevesi:

- `apps/api` standart bir Node service (HTTP framework + Mongo driver). Stack pick (Hono / Fastify / Express, native driver / Mongoose, Zod) ayrı bir ADR'ye (P2-B / [#392](https://github.com/toss-cengiz/glaon/issues/392)) bırakıldı; bu ADR sadece "ayrı service mi yoksa Next.js geçişi mi" ekseninde dondurma yapıyor.
- HA-canlı verisi (cihaz state, command'lar) WebSocket üzerinden HA'dan akmaya devam ediyor — `apps/api` HA proxy'si değil. `apps/api` yalnız HA-dışı kalıcı veriyi yönetiyor (sınır net).
- Web ve mobile aynı `apps/api` kontratını paylaşıyor; client + Zod schema'ları `@glaon/core`'a (veya yeni bir `@glaon/api-client` paketine) taşınıyor (P2-E).
- HA OAuth (ADR 0005) kimlik kaynağı olarak kalıyor; `apps/api` kendi IdP'si değil, HA token'ı doğrulayarak veya kısa session JWT üreterek oturum köprüsü kuruyor (P2-D).
- Teslim modeli (HA Add-on sidecar container vs ayrı hosted service) açık karar (P2-G); `apps/api` her iki şekilde de paketlenebilecek şekilde yazılıyor.
- [ADR 0009](0009-ha-addon-ingress-delivery.md) Add-on + Ingress birincil teslim kanalı olarak değişmiyor; web bundle hâlâ statik nginx üzerinden serve ediliyor.

## Sonuçlar

### Olumlu

- HA Add-on packaging'i (nginx + statik bundle) hiç değişmiyor — Phase 1 teslim kanalı korunuyor.
- Mongo driver'ı ve secret'lar server tarafında kalıyor; tarayıcı asla göremiyor.
- HA-canlı verisi ile HA-dışı kalıcı veri arasındaki sınır kodda da net: WebSocket katmanı `@glaon/core`'da, REST katmanı `@glaon/api-client`'ta.
- Mobile (`apps/mobile`) aynı `apps/api` ile parametrik konuşuyor; ek bir backend yazmaya gerek yok.
- Vite + Storybook + Chromatic + Figma plugin pipeline'ı dokunulmadan kalıyor → Phase 1'in görsel regresyon ve tasarım-kod doğrulaması bozulmuyor.
- Stack pick'i (P2-B) bu ADR'ye bağlı kalmadan ayrı tartışılabiliyor; Next.js'e geçişe oranla geri-dönüş maliyeti çok düşük (yerine başka bir Node framework koymak küçük bir refactor).

### Olumsuz / ödenecek bedel

- Tek build hedefi yerine iki var: `apps/web` (statik bundle) ve `apps/api` (Node service). CI matrisi büyüyor (P2-H).
- HA OAuth'tan `apps/api` session'ına köprü kurulması ek auth karmaşıklığı (P2-D); CSP, cookie strategy ve token storage kuralları (ADR 0006) bu köprüyle uyumlu kalmak zorunda.
- İkinci runtime'ın operasyon yükü (log toplama, metrics endpoint, secret rotation, uptime). Sentry zaten kurulu (ADR 0007); `apps/api` aynı pipeline'a bağlanacak.
- Add-on sidecar paketleme seçilirse Dockerfile karmaşıklaşıyor (iki container, supervisor lifecycle); hosted servis seçilirse self-host kullanıcı için ayrı bir kurulum adımı doğuyor. Tradeoff P2-G'de çözülecek.
- Native push (server → client) sürece dahil değil — Phase 2 ilk turunda polling/REST kalıyor; ihtiyaç doğunca WebSocket veya SSE ayrı bir karar.

### Etkileri

- [CLAUDE.md — Stack](../../CLAUDE.md#stack) bölümü `apps/api` workspace'ini ve "HA-external storage backend" rolünü dokümante edecek (epic #392 onaylanınca).
- [CLAUDE.md — Package Boundaries](../../CLAUDE.md#package-boundaries) güncellenir: `@glaon/api-client` (veya `@glaon/core` extension) hem web hem mobile'dan import edilebilir; `apps/api` Node-only.
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) iki backend (HA + apps/api) topolojisini ve veri akış diyagramını içerecek (P2-C kapsamında).
- [`addon/README.md`](../../addon/README.md) sidecar veya hosted teslim modeli karar verildikten sonra güncellenir (P2-G).
- Renovate konfigürasyonu (`renovate.json`) `apps/api` workspace'ini de gruplayacak — Phase 1 grupları üzerine ekleniyor.
- Audit policy (CI'daki `pnpm audit --audit-level high`) yeni paket için aynen geçerli; `apps/api`'nin kendine ait CI workflow'u P2-H'de kuruluyor.

## Tekrar değerlendirme tetikleyicileri

- HA Add-on Supervisor sidecar container desteğinde kırılma olursa (sidecar paketleme yolu kapanırsa) — teslim modeli (P2-G) yeniden değerlendirilir; bu ADR'nin ana kararı (apps/api ayrı service) etkilenmez.
- Phase 2'nin sonunda `apps/api`'deki feature kapsamının `apps/web` Next.js geçişi ile daha az koda mal olacağı netleşirse (örn. yoğun SSR/RSC ihtiyacı, edge function gereksinimleri) bu ADR superseded edilebilir.
- HA, kalıcı kullanıcı verisi için resmi bir API (HA-external storage abstraction) yayınlarsa, `apps/api`'nin varlık nedeni daralır → ADR yeniden değerlendirilir.
- MongoDB seçimi başka bir veri deposuyla (Postgres, SQLite + Litestream, vs.) değişirse: bu ADR yine geçerli (ayrı backend service kararı), ama stack ADR'si (P2-B) yeniden yazılır.

## Referanslar

- Epic [#392 — apps/api backend service for HA-external data](https://github.com/toss-cengiz/glaon/issues/392)
- Sub-issue [#393 — ADR 0014 yazımı](https://github.com/toss-cengiz/glaon/issues/393)
- [ADR 0002 — Vite + React 19 (web)](0002-vite-react-19-web.md)
- [ADR 0009 — HA Add-on + Ingress teslim kanalı](0009-ha-addon-ingress-delivery.md)
- [ADR 0005 — OAuth2 Authorization Code + PKCE](0005-oauth2-pkce-only-auth.md)
- [ADR 0006 — Token storage](0006-token-storage.md)
