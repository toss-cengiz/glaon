# ADR 0025 — apps/api stack pick: Hono + native MongoDB driver + Zod

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-09
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [ADR 0014](0014-apps-api-over-nextjs.md), [ADR 0020](0020-cloud-hosting-platform.md), [issue #416](https://github.com/toss-cengiz/glaon/issues/416), [issue #392](https://github.com/toss-cengiz/glaon/issues/392)

> **Numaralandırma notu:** İlgili issue (#416) ADR'nin 0024 numarasını alacağını yazdı, ancak 0024 #350 (lokal keşif) ile harcanmıştı. Bu ADR 0025 numarasında landed; #416 başlığı tarihsel referans.

## Bağlam

[ADR 0014](0014-apps-api-over-nextjs.md) `apps/api`'ı ayrı bir backend service olarak konumlandırmış (Next.js migration yerine). Stack seçimi orada bilinçli olarak ertelenmişti — `apps/api`'a tek satır kod düşmeden, framework + Mongo client + schema validation kararları kilitlenmeli ki her scaffold PR'ı "Hono vs Fastify?" ve "native driver vs Mongoose?" tartışmasını yeniden açmasın.

Bu ADR üç soruyu kapatıyor:

1. **HTTP framework** — Hono / Fastify / Express
2. **Mongo client** — native `mongodb` driver / Mongoose
3. **Schema validation** — Zod / Yup / io-ts / Valibot

Üçü kompoze edilince route handler şu hat üzerinde yürür:

```
HTTP request
  → Hono context
  → Zod request-schema parse  ─ 400 if invalid
  → MongoDB driver call (Zod-shaped DTO)
  → Zod response-schema parse ─ 500 if invalid
  → JSON response
```

## Karar

### 1. HTTP framework: **Hono**

Karşılaştırma:

| Eksen                  | Hono                                                  | Fastify                                       | Express                         |
| ---------------------- | ----------------------------------------------------- | --------------------------------------------- | ------------------------------- |
| Bundle                 | ~14 kB (no deps in core)                              | ~50 kB + ajv + plugin tree                    | ~200 kB w/ middleware           |
| TS ergonomics          | Native, generics-first; `Hono<{Bindings, Variables}>` | Type plugins, manual annotations              | None — `@types/express` veneer  |
| Plugin ecosystem       | Smaller but growing; we wrap our own                  | Mature (auth, swagger, multipart, rate limit) | Largest npm ecosystem           |
| Edge portability       | Workers/Bun/Node/Deno — primary use-case              | Node-first; partial Edge                      | Node-only                       |
| Middleware composition | `c.req.xxx` + `next()` — modern async                 | Plugin lifecycle hooks                        | Imperative `req/res` + `next()` |
| `apps/cloud` uyumu     | ✓ Zaten Hono (ADR 0020)                               | ✗ Yeni stack                                  | ✗ Eski paradigma                |

Hono kazanır çünkü:

- **`apps/cloud` zaten Hono.** Ekibin tek bir route definition + middleware paradigması öğrenmesi yeter; cloud'dan api'a geçiş context değil dosya değişikliği.
- **Bundle ekonomisi** — `apps/api` Docker image'ında her MB sayar (sidecar dağıtımı seçilirse, P2-G).
- **TypeScript-first** — Hono'nun `c.req.json<T>()`, `c.var.userId` tip akışı ek decorator gerektirmiyor.
- **Edge-portability** — `apps/api` ileride Workers'a taşınmak istenirse (Mongo Atlas Data API üstüne, P2-G alternatifi) Hono'nun aynı kodu az değiştirerek çalıştırması mümkün. Fastify'da bu yol kapalı.

Fastify ekosistem üstünlüğü reddedildi çünkü ihtiyacımız olan plugin'ler (auth, validation, multipart) Hono'da ya hazır ya da 50 satırlık inline middleware ile karşılanıyor. Express performans + tip ergonomisi açısından modası geçmiş.

### 2. Mongo client: **native `mongodb` driver**

Karşılaştırma:

| Eksen                       | `mongodb` (native)                                      | Mongoose                                    |
| --------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| Schema source of truth      | Zod (uygulama kodunda) + Mongo'nun şeması (JSON Schema) | Mongoose Schema (her iki rol)               |
| Validation                  | Zod parse (request + persist + response)                | Mongoose validators (sınırlı tip aktarımı)  |
| Hooks (pre-save, post-find) | Yok — explicit middleware tabanlı                       | Yerleşik (avantaj veya kara kutu olabilir)  |
| Bundle                      | ~ 1 MB driver                                           | ~ 3 MB driver + Mongoose                    |
| Performance                 | Driver direkt; aggregation builder isteğe bağlı         | Mongoose abstraction layer (~%5–%15 yavaş)  |
| TypeScript                  | Generic `Collection<T>`; T'yi Zod'dan üretiriz          | Mongoose tipleri ayrı ekosistem; çift kayıt |
| Migration                   | Manuel (run-once script + collection.createIndex)       | mongoose-migrate + plugins                  |

Native driver kazanır çünkü:

- **Tek source of truth.** Zod schema'sı request, persisted document, ve response için aynı objeyi tanımlar. Mongoose seçilseydi, Mongoose Schema + Zod (request validation için) + TS interface = üçlü dilemma.
- **Document-shape esnekliği.** HA-external veriler (kayıtlı dashboard layout'ları, kullanıcı tercihleri) yapısı evrim geçirebiliyor; Mongoose'un sıkı şeması tabloya migration cost yükler. Zod schema versioning daha hafif.
- **Hooks / virtuals ihtiyacımız yok.** Service-layer middleware (auth, telemetry) Hono tarafında ele alınıyor; driver seviyesine taşımak ihtiyacımız değil.
- **Bundle.** Sidecar dağıtımı seçilirse Docker image 2 MB daha küçük.

Mongoose'un avantajı (mature ecosystem, plugin'ler) ihtiyacımız olan workload için orantısız: ne karmaşık populate, ne çok-belge transaction, ne lifecycle hook'a bel bağlamayan kod yazmıyoruz.

### 3. Schema validation: **Zod**

Aday değerlendirmesi:

| Lib     | Bundle | TS inference | Async refinements | apps/cloud uyumu     |
| ------- | ------ | ------------ | ----------------- | -------------------- |
| **Zod** | ~12 kB | First-class  | ✓                 | ✓ Zaten kullanılıyor |
| Yup     | ~28 kB | Sınırlı      | ✓                 | ✗ Yeni dep           |
| io-ts   | ~25 kB | First-class  | Sınırlı           | ✗ Yeni dep           |
| Valibot | ~3 kB  | First-class  | ✓                 | ✗ Yeni dep           |

Zod kazanır çünkü:

- **`apps/cloud` zaten Zod** (relay envelope, pair endpoints, JWT claims). `apps/api` aynı schema-tanımlama disiplinini kullanırsa shared `@glaon/core` schema'ları (P2-E) sürtünmesiz akar.
- **Web + mobile aynı schema'ları tüketir** — `@glaon/core` üzerinden Zod Inference ile uçtan uca tip güvenliği. Yup veya io-ts seçilseydi, frontend tarafı ya başka bir lib öğrenir ya çift validation yapardı.
- Valibot bundle olarak küçük; ama ekosistem (zod-to-openapi, zod-to-json-schema, zod-mongoose-types) Zod tarafında çok daha olgun.

Zod schema → Mongo `Collection<z.infer<typeof Schema>>` deseni:

```ts
const SavedLayout = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string().min(1).max(64),
  payload: z.record(z.unknown()),
  updatedAt: z.number().int(),
});
type SavedLayout = z.infer<typeof SavedLayout>;

const layouts: Collection<SavedLayout> = db.collection('saved_layouts');
```

Request handler:

```ts
app.post('/layouts', requireSession, async (c) => {
  const body = SavedLayout.omit({ id: true, userId: true, updatedAt: true }).parse(
    await c.req.json(),
  );
  const doc: SavedLayout = {
    id: crypto.randomUUID(),
    userId: c.get('userId'),
    ...body,
    updatedAt: Date.now(),
  };
  await layouts.insertOne(doc);
  return c.json(SavedLayout.parse(doc), 201);
});
```

Response Zod parse'ı paranoid duruyor — runtime'da DB'den dönen şey schema'ya uymuyorsa 500 atılır, frontend kirli veri görmez.

## Sonuçlar

### Olumlu

- **Stack tutarlılığı** — Hono + Zod ikilisi `apps/cloud` ile aynı; `apps/api` bağımsız bir kod tabanı değil, mevcut paradigmanın uzantısı.
- **Tek source of truth** — Zod schema document shape, request body, response body için aynı kullanıyor. Type drift olası alan sayısı 1 (Zod) yerine 3'e (Zod + Mongoose Schema + TS interface) çıkmıyor.
- **Bundle ekonomisi** — Sidecar dağıtımı (P2-G) seçilirse Docker image ~3-5 MB daha küçük.
- **Edge-future** — Hono tabanı ileride Workers / Bun runtime'a taşımayı kolaylaştırır.

### Olumsuz / ödenecek bedel

- **Migration aracımız yok.** Mongoose'da `mongoose-migrate` hazır gelirdi; native driver tarafında manuel migration script'leri yazıyoruz (idempotent, run-once). P2-C scaffold'ında `apps/api/migrations/` klasörü konvansiyonu kurulur; gerçek migration runner küçük bir helper ile yazılır. Buradaki risk küçük çünkü Phase 2 kapsamında veri şeması yalın (dashboard layout = key/value, user preference = blob).
- **Hooks (pre-save / post-find) yok.** Audit log, soft-delete gibi cross-cutting concern'ler explicit middleware ile yapılır. Bu daha iyi (kara kutu yok) ama biraz daha kod yazılır.
- **TS interface ↔ Zod schema duplikasyonu olası.** Disiplin: her tip Zod'dan `z.infer` ile türetilir; el yazımı interface yazılmaz. Lint kuralı veya kod review check'i ile takip edilir.
- **Hono'nun plugin ekosistemi Fastify'a göre küçük.** İhtiyacımız olan auth + rate-limit + observability'yi `apps/cloud`'da olduğu gibi yerli middleware'lerle yapacağız (P2-D, P2-I).

### Etkileri

- **P2-C scaffold** (#417): `apps/api/package.json` deps `hono`, `mongodb`, `zod`. Dockerfile node 22 + healthcheck. docker-compose `mongo:7` service.
- **P2-D auth bridge** (#418): Hono middleware paterni; session JWT issuer.
- **P2-E shared client** (#419): `@glaon/core/api` Zod schema'larını export eder; web ve mobile tüketir.
- **P2-F first endpoint** (#420): Saved dashboard layouts; bu ADR'nin örnek pattern'i ile.
- **P2-G delivery** (#421): Sidecar Docker veya Worker port; iki yol da Hono ile mümkün.
- **P2-I observability** (#423): `apps/cloud/src/logger.ts` benzeri scrubbed JSON log + Sentry entegrasyonu.

## Tekrar değerlendirme tetikleyicileri

- **Hono** — major version değişiminde middleware kontratı kırılırsa veya Fastify-style decorator pattern'ı zorunlu hale gelirse.
- **Native driver** — MongoDB Atlas Data API zorunlu hale gelirse (HTTP-only erişim) — Hono tarafı aynı kalır ama Collection abstraction'ı farklı; o noktada Mongoose alternatifi yine değerlendirilmiyor (Atlas Data API native HTTP).
- **Zod** — TC39 type validation primitive'i veya runtime type guard standardı çıkarsa.

## Referanslar

- [Hono docs](https://hono.dev)
- [MongoDB Node Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [Zod docs](https://zod.dev)
- [Hono `apps/cloud` kullanımı](../../apps/cloud/src/index.ts)
- [ADR 0014](0014-apps-api-over-nextjs.md) — `apps/api` ayrı backend service kararı
- [ADR 0020](0020-cloud-hosting-platform.md) — `apps/cloud` Worker stack'i
