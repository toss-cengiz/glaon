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

## References

- [ADR 0017 — dual-mode auth](../../docs/adr/0017-dual-mode-auth.md)
- [ADR 0018 — cloud relay topology + wire protocol](../../docs/adr/0018-cloud-relay-topology.md)
- [ADR 0019 — Clerk identity provider](../../docs/adr/0019-identity-provider-clerk.md)
- [ADR 0020 — Cloud hosting (CF Workers + Durable Objects)](../../docs/adr/0020-cloud-hosting-platform.md)
- [ADR 0021 — Pairing protocol + relay credentials](../../docs/adr/0021-pairing-and-relay-credentials.md)
- [ADR 0022 — Cloud deployment + secrets pipeline](../../docs/adr/0022-cloud-deployment-secrets.md)
