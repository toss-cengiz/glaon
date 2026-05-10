# apps/api — Glaon backend service

`apps/api` Glaon'un HA-external persistence katmanıdır: saved layouts, user prefs, ve gelecek feature'lar için durabilirlik. ADR ailesi:

- [ADR 0014](adr/0014-apps-api-over-nextjs.md) — `apps/api` ayrı service kararı.
- [ADR 0025](adr/0025-apps-api-stack.md) — Hono + native MongoDB + Zod stack pick.
- [ADR 0026](adr/0026-apps-api-delivery-hosted.md) — Glaon-managed hosted delivery model.
- [Epic #392](https://github.com/toss-cengiz/glaon/issues/392) — bütün apps/api iş ailesi.

## Lokal geliştirme

`apps/api` içinde:

```bash
cp .env.example .env
# .env dosyasını doldur: en azından SESSION_JWT_SECRET set et
# (üretim için: openssl rand -hex 32)

# Mongo + apps/api birlikte
docker compose up --build
```

Servis `localhost:8080`'de çalışır. Smoke test:

```bash
curl http://localhost:8080/healthz
# {"status":"ok","mongo":{"ok":true,"latencyMs":3}}

curl http://localhost:8080/version
# {"version":"0.0.0-dev","commit":"unknown","builtAt":""}
```

Sadece Node tarafını watch mode'da çalıştırmak (Mongo zaten ayağa kalkmış):

```bash
pnpm --filter @glaon/api dev
```

Detaylar: [apps/api/README.md](../apps/api/README.md).

## Endpoint'ler

| Method | Path                      | Auth    | Açıklama                                                      |
| ------ | ------------------------- | ------- | ------------------------------------------------------------- |
| GET    | `/healthz`                | yok     | Liveness + Mongo ping (200/503).                              |
| GET    | `/version`                | yok     | Build SHA + version + builtAt.                                |
| POST   | `/auth/exchange`          | yok     | HA token → session JWT.                                       |
| POST   | `/auth/refresh`           | yok     | Session JWT'yi yeniden imzala.                                |
| POST   | `/auth/logout`            | session | Session jti'yi revocation list'e ekle.                        |
| POST   | `/auth/ha/password-grant` | yok     | HA `login_flow` proxy: username/password → tokens (ADR 0027). |
| GET    | `/layouts`                | session | Saved layouts list (`?homeId=` filtre).                       |
| POST   | `/layouts`                | session | Yeni layout oluştur.                                          |
| GET    | `/layouts/:id`            | session | Layout detayı.                                                |
| PUT    | `/layouts/:id`            | session | Layout güncelle.                                              |
| DELETE | `/layouts/:id`            | session | Soft-delete (204).                                            |

Authorization: session JWT ya `Authorization: Bearer <jwt>` (mobile) ya da `glaon_api_session` httpOnly+Secure cookie (web). Detaylar [ADR 0017](adr/0017-dual-mode-auth.md).

### `POST /auth/ha/password-grant`

Glaon'un Login screen'inin Device sekmesi tarafından kullanılır ([ADR 0027](adr/0027-ha-login-flow-proxy.md)). Kullanıcı HA OAuth redirect ekranını hiç görmez; credentials Glaon UI'da toplanıp `apps/api` üzerinden HA'nın `/auth/login_flow` API'sine proxy edilir.

**Request body**

```json
{
  "haBaseUrl": "http://homeassistant.local:8123",
  "username": "olivia",
  "password": "<password>",
  "clientId": "https://app.glaon.com/"
}
```

**Response 200**

```json
{
  "haAccess": {
    "accessToken": "<HA JWT>",
    "refreshToken": "<HA refresh>",
    "expiresIn": 1800,
    "tokenType": "Bearer"
  },
  "sessionJwt": "<glaon session>",
  "expiresAt": 1742755200000
}
```

İstemci `haAccess.refreshToken`'ı `local` slot grubuna yazar (web httpOnly cookie / mobile SecureStore — [ADR 0006](adr/0006-token-storage.md)). HA refresh tokenı **`apps/api` veritabanında persist edilmez**.

**Hata durumları**

| Status | `error`               | Anlam                                                                                                                |
| ------ | --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 400    | `invalid` (bad-body)  | Zod doğrulaması başarısız (eksik alan, geçersiz URL).                                                                |
| 400    | `invalid-url`         | `haBaseUrl` http/https değil ya da parse edilemedi.                                                                  |
| 401    | `invalid-credentials` | HA `login_flow` `type: "abort"` döndü (kötü kullanıcı adı/parola).                                                   |
| 502    | `mfa-required`        | HA çoklu adımlı bir form istedi (TOTP, notify-app); UI'da kullanıcı HA üzerinden direct login yapmaya yönlendirilir. |
| 502    | `unreachable`         | HA'ya bağlanılamadı (DNS, network, timeout).                                                                         |
| 502    | `flow-error`          | HA'dan beklenmeyen bir response geldi (corrupt JSON, eksik alan).                                                    |

## Production deploy

Hosting modeli ADR 0026 ile sabitlenmiş **Glaon-managed hosted**. Üretim akışı:

1. **CI** — `apps/api/Dockerfile` multi-arch image üretir, GHCR'ye push eder.
2. **Deploy** — Platform-specific workflow (Fly.io / Render / Hetzner — final pick #422 ile gelir) image'ı çeker, secret'ları inject eder, rolling restart ile çalıştırır.
3. **Mongo** — Atlas M10 cluster (üç-node replica set), apps/api `MONGODB_URI`'yle bağlanır. TLS Atlas tarafında zorunlu.

### Secrets runbook

Tüm secret'lar deploy pipeline'ı tarafından platform secret store'una inject edilir; repo'da `.env` ya da kod içinde **asla** tutulmaz. ADR 0022'nin `apps/cloud` paterni `apps/api` için aynen geçerli.

| Secret               | Source                        | Rotation                                         |
| -------------------- | ----------------------------- | ------------------------------------------------ |
| `MONGODB_URI`        | Atlas → repo secret           | Atlas connection string regenerate; redeploy.    |
| `SESSION_JWT_SECRET` | `openssl rand -hex 32`        | Yılda en az bir kez. Rotation prosedürü altında. |
| `SENTRY_DSN`         | Sentry project                | Project recreate gerekirse.                      |
| `WEB_ORIGINS`        | Manuel — prod web origin'leri | Web bundle host değişimi.                        |

#### `SESSION_JWT_SECRET` rotation

1. Yeni secret üret: `openssl rand -hex 32`.
2. Platform secret store'a yeni değeri yaz (eski değer hâlâ aktif).
3. Deploy: Yeni instance'lar yeni secret'ı kullanır, eski JWT'ler 401 döner — istemciler `/auth/refresh` ile yeni session alır. Refresh `sessionJwt`'yi yeni secret ile imzaladığı için yeni secret aktif olduktan sonra bu yol kapanır; bu durumda istemci `/auth/exchange` ile baştan auth olur (HA token'ı ile).
4. Pratik tutmak için bir grace window (eski + yeni secret birlikte kabul) gerekirse `apps/api/src/auth/jwt.ts` içinde dual-key verification eklenir. Şu an kapsam dışı; kullanıcı sayısı arttığında değerlendirilir.

### Healthcheck + liveness

- `GET /healthz` Mongo'ya `{ ping: 1 }` admin command atar; 200/503 döner.
- LB / orchestrator'ın healthcheck endpoint'i `/healthz`'i 30s aralıkla yoklar.
- Container içinde Dockerfile'ın `HEALTHCHECK` direktifi aynı endpoint'i kullanır.

## Sorun giderme

| Belirti                                                       | Çözüm                                                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Boot sırasında "MONGODB_URI is required"                      | `.env` dosyasında `MONGODB_URI` set değil. `cp .env.example .env`, doldur.                                    |
| Boot sırasında "SESSION_JWT_SECRET must be at least 32 bytes" | Secret 32 byte'tan kısa. `openssl rand -hex 32` ile üret.                                                     |
| `/healthz` 503 + `mongo.ok=false`                             | Mongo erişilemez. Connection string + network + Atlas IP allowlist'i kontrol et.                              |
| `/auth/exchange` 401                                          | HA token geçersiz veya HA URL yanlış. `MONGODB_URI` veya cookie değil; HA reachability problemi.              |
| `/auth/exchange` 502                                          | apps/api HA'a ulaşamıyor. HA Add-on tarafının dış erişimi varsa CORS / DNS problemi.                          |
| Session JWT 401 / "revoked-session"                           | Logout edilmiş JWT yeniden kullanılıyor. Client `/auth/exchange` ile yeniden oturum açmalı.                   |
| Mongo TTL index "session_revocations" temizliği               | Mongo monitor'i 60s aralıklarla çalışır; expire'ı geçen entry'ler otomatik silinir. Manuel müdahale gerekmez. |

Daha derin debug için Sentry breadcrumbs (#423 P2-I observability) sonrası tracing ile bağlam alınır.

## İlişkili dokümanlar

- [apps/api/README.md](../apps/api/README.md) — workspace-level README.
- [ADR 0014](adr/0014-apps-api-over-nextjs.md), [ADR 0017](adr/0017-dual-mode-auth.md), [ADR 0025](adr/0025-apps-api-stack.md), [ADR 0026](adr/0026-apps-api-delivery-hosted.md).
- [Epic #392](https://github.com/toss-cengiz/glaon/issues/392), sub-issues #417–#423.
