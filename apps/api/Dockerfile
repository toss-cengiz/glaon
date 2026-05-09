# Multi-stage build for apps/api. Stage 1 installs deps + builds the
# bundle; stage 2 ships only the runtime artifacts on a slim Node image
# under a non-root user. Sidecar / hosted dağıtımı yelpazesi P2-G ile
# kararlaştırılana kadar her iki yola da uyumlu kalır.

# ---- builder --------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /workspace

# Copy minimum needed to install workspace deps. The repo uses pnpm
# workspaces; the apps/api scaffold is self-contained on the source
# side, but the Dockerfile is intended to be built from the repo root
# with a `--build-arg API_PATH=apps/api` style invocation in the
# eventual P2-H CI workflow. For now copy the whole repo (CI tags this
# as a TODO) — the bundle output is what matters.
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/api ./apps/api
COPY packages/config ./packages/config

# hadolint ignore=DL3018
RUN apk add --no-cache python3 make g++ \
    && corepack enable \
    && corepack prepare pnpm@9.15.0 --activate \
    && pnpm install --frozen-lockfile --filter @glaon/api... \
    && pnpm --filter @glaon/api build

# ---- runtime --------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /opt/glaon-api

# `node:22-alpine` ships with a `node` user already; reuse it so we
# never run as root inside the container.
COPY --from=builder /workspace/apps/api/dist ./dist

USER node

ENV NODE_ENV=production \
    PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider "http://127.0.0.1:${PORT}/healthz" || exit 1

CMD ["node", "dist/index.cjs"]
