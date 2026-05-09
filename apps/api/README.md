# @glaon/api

Glaon'un HA-external veriler için ayrı backend service'i. ADR ve sub-issue ailesi:

- [ADR 0014](../../docs/adr/0014-apps-api-over-nextjs.md) — `apps/api` ayrı service kararı.
- [ADR 0025](../../docs/adr/0025-apps-api-stack.md) — stack pick: Hono + native MongoDB + Zod.
- [Epic #392](https://github.com/toss-cengiz/glaon/issues/392) — bütün apps/api iş ailesi.
- [Sub-issue #417](https://github.com/toss-cengiz/glaon/issues/417) — bu scaffold.

## Stack

- **Hono** — HTTP framework. Route handler'lar `c.req.json<T>()` + `c.var.userId` ile tip akışı sağlar.
- **mongodb** native driver — Zod ile uçtan uca tip akışı (request → DB → response).
- **Zod** — request body, persisted document, response body için tek source of truth.
- Build: `tsc -b && esbuild ... --outfile=dist/index.cjs` — single-file Node bundle.
- Test: vitest, environment `node`.

## Geliştirme

### Yerel (sadece Node, Mongo ayrı)

```bash
# Mongo'yu başlat (compose'la veya brew servisi ile)
docker run --rm -p 27017:27017 mongo:7

# Env dosyası
cp apps/api/.env.example apps/api/.env
# .env dosyasını dolur — varsayılan değerler dev için yeter

# Watch mode
pnpm --filter @glaon/api dev
```

`http://localhost:8080/healthz` 200 + Mongo ping JSON'u döner.

### Compose (Mongo + apps/api birlikte)

```bash
cd apps/api
docker compose up --build
```

Compose Mongo'yu sağlıklı hale gelmesini bekler, sonra api'ı başlatır. Healthcheck `wget /healthz` — 30 saniyede bir.

```bash
curl http://localhost:8080/healthz
# {"status":"ok","mongo":{"ok":true,"latencyMs":3}}

curl http://localhost:8080/version
# {"version":"0.0.0-dev","commit":"unknown","builtAt":""}
```

## Endpoint'ler (P2-C kapsamı)

| Method | Path       | Açıklama                                                   |
| ------ | ---------- | ---------------------------------------------------------- |
| GET    | `/healthz` | Liveness + Mongo ping. 200/503 durumuna göre LB drop eder. |
| GET    | `/version` | Build SHA + version + built-at metadata'ı.                 |

Auth bridge (P2-D, #418), shared client (P2-E, #419), domain endpoint (P2-F, #420), observability (P2-I, #423) sırayla ekstra layer olarak gelir.

## Build

```bash
pnpm --filter @glaon/api build
# dist/index.cjs single-file bundle
```

Docker image:

```bash
docker build -f apps/api/Dockerfile -t glaon/api:dev .
```

Multi-stage: builder katmanı pnpm + esbuild bundle eder, runtime katmanı `node:22-alpine` üstünde non-root `node` user ile çalışır. `HEALTHCHECK` tanımlı.

## Test

```bash
pnpm --filter @glaon/api test
```

Mongo'ya bağlanma testi yok (entegrasyon testleri P2-H ile compose üzerinde gelir). Birim testler `db.command({ping:1})` çağrısını mock'lar — gerçek bağlantı sadece runtime'da kurulur.

## Konfigürasyon

| Env                  | Default     | Açıklama                      |
| -------------------- | ----------- | ----------------------------- |
| `MONGODB_URI`        | _(zorunlu)_ | Mongo connection string       |
| `MONGODB_DB`         | `glaon`     | Database adı                  |
| `PORT`               | `8080`      | HTTP port                     |
| `LOG_LEVEL`          | `info`      | `debug`/`info`/`warn`/`error` |
| `GLAON_API_VERSION`  | `0.0.0`     | Deploy pipeline injects       |
| `GLAON_API_COMMIT`   | `unknown`   | Git SHA                       |
| `GLAON_API_BUILT_AT` | `""`        | ISO 8601 build timestamp      |

## İlişkili işler

- ADR 0014, ADR 0025
- Epic #392
- Sub-issues #418, #419, #420, #421, #422, #423
