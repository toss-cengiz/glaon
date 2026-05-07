# `@glaon/cloud`

Glaon cloud relay + home-registry service. Deployed as a Cloudflare Worker
(per [ADR 0020](../../docs/adr/0020-cloud-hosting-platform.md)) with the
deployment + secrets pipeline locked by
[ADR 0022](../../docs/adr/0022-cloud-deployment-secrets.md).

This package landed in [#343](https://github.com/toss-cengiz/glaon/issues/343)
with the bare scaffold:

- `GET /healthz` — liveness probe.
- `GET /version` — build info (commit SHA, build time, environment).
- Structured JSON logger with PII scrubber (HA WS payloads, OAuth tokens, Clerk
  JWTs never leak — ADR 0018 risk C14 invariant).
- Sentry hookup point (full SDK lands with the deploy pipeline in
  [#347](https://github.com/toss-cengiz/glaon/issues/347)).

The home registry, WS relay endpoint, and pairing endpoint layer onto this
scaffold in [#344](https://github.com/toss-cengiz/glaon/issues/344),
[#345](https://github.com/toss-cengiz/glaon/issues/345), and
[#346](https://github.com/toss-cengiz/glaon/issues/346).

## Local dev

```bash
cp .env.example .env       # fill in SENTRY_DSN if you want Sentry locally
pnpm --filter @glaon/cloud dev
# wrangler dev --local on http://localhost:8787 by default
curl http://localhost:8787/healthz
```

## Tests

```bash
pnpm --filter @glaon/cloud test
pnpm --filter @glaon/cloud test:coverage
```

## Build

```bash
pnpm --filter @glaon/cloud build
# wrangler deploy --dry-run --outdir=dist — produces a deployable artifact
```

## Secrets

Production + staging secrets live in CF Worker env, set via `wrangler secret put`
through the deploy workflow (ADR 0022). Local dev reads `.env` (gitignored).

The deploy workflow ([`.github/workflows/cloud-deploy.yml`](../../.github/workflows/cloud-deploy.yml))
pipes each secret in over stdin so the value never lands in argv or logs. Secrets
the workflow expects, scoped to GH Actions environment `staging` / `production`:

| Secret               | Required | Notes                                   |
| -------------------- | -------- | --------------------------------------- |
| `CF_API_TOKEN`       | yes      | Wrangler auth                           |
| `CF_ACCOUNT_ID`      | yes      | Target account                          |
| `CLERK_SECRET_KEY`   | yes      | Per-env                                 |
| `CLERK_ISSUER`       | yes      | Per-env (publicly known but env-scoped) |
| `SENTRY_DSN`         | optional | Per-env, optional in staging            |
| `PAIR_BCRYPT_SECRET` | optional | #346 lockout pepper                     |

## Deploy & rollback

Per ADR 0022, deploys are **automatic from `development` (staging) and `main`
(production)**. Manual rollback uses `workflow_dispatch`.

**Auto deploy:**

- Push to `development` → staging deploys via `wrangler deploy --env staging`,
  D1 migrations applied, healthz smoke verified.
- Push to `main` → production deploy with the same gates.

**Forward-only schema:** D1 migrations live in [`migrations/`](./migrations/);
they apply with `wrangler d1 migrations apply` before the Worker deploys (so
the new Worker reads the new schema). Schema changes follow ADR 0022's
add → migrate → drop pattern; backward-compat is on the author.

**Manual rollback:**

1. Find the deployment id you want to revert to via `wrangler deployments list --env <env>`
   (or in the Cloudflare dashboard under Workers → Deployments).
2. Trigger the workflow from GitHub Actions → "cloud-deploy" → "Run workflow".
3. Pick the target environment, paste the deployment id into the
   `rollback_to` input. The workflow skips the test / build / migration steps
   and runs `wrangler rollback <id>` directly.

> **Hot fix vs. rollback:** for code-only regressions a rollback is fast (≈2 min
> per ADR 0022 MTTR). For schema-coupled regressions, write a compensating
> forward migration first, then deploy that — rollback alone will leave the
> Worker reading the new schema.

**Local dry-run:** `pnpm --filter @glaon/cloud build` runs `wrangler deploy
--dry-run --outdir=dist` and produces the deployable artefact without touching
production.

## References

- [ADR 0017 — dual-mode auth](../../docs/adr/0017-dual-mode-auth.md)
- [ADR 0018 — cloud relay topology + wire protocol](../../docs/adr/0018-cloud-relay-topology.md)
- [ADR 0019 — Clerk identity provider](../../docs/adr/0019-identity-provider-clerk.md)
- [ADR 0020 — Cloud hosting (CF Workers + Durable Objects)](../../docs/adr/0020-cloud-hosting-platform.md)
- [ADR 0021 — Pairing protocol + relay credentials](../../docs/adr/0021-pairing-and-relay-credentials.md)
- [ADR 0022 — Cloud deployment + secrets pipeline](../../docs/adr/0022-cloud-deployment-secrets.md)
