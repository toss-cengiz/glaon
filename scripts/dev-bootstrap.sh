#!/usr/bin/env bash
# Glaon dev bootstrap (#521). Prepares a fresh checkout to run
# `pnpm dev` without surprises:
#   - apps/api/.env is created from apps/api/.env.example if missing.
#   - SESSION_JWT_SECRET is populated with `openssl rand -hex 32` when
#     empty (apps/api's Zod schema requires ≥32 bytes).
#
# Idempotent — safe to re-run; existing values are preserved.

set -euo pipefail

# Resolve repo root from the script location so the script works from
# any cwd. The script lives in `scripts/` directly under the repo root.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$REPO_ROOT/apps/api"
API_ENV="$API_DIR/.env"
API_ENV_EXAMPLE="$API_DIR/.env.example"

if [ ! -f "$API_ENV_EXAMPLE" ]; then
  echo "✖ apps/api/.env.example missing — repo state is incomplete." >&2
  exit 1
fi

if [ ! -f "$API_ENV" ]; then
  cp "$API_ENV_EXAMPLE" "$API_ENV"
  echo "✓ created apps/api/.env from .env.example"
else
  echo "· apps/api/.env already exists — leaving it alone"
fi

# Generate a session secret only if the line is `SESSION_JWT_SECRET=`
# with no value. Re-running on an already-populated file is a no-op.
if grep -qE '^SESSION_JWT_SECRET=\s*$' "$API_ENV"; then
  if ! command -v openssl >/dev/null 2>&1; then
    echo "✖ openssl not found — generate a 32-byte secret manually:" >&2
    echo "    SESSION_JWT_SECRET=<64 hex chars>" >&2
    exit 1
  fi
  SECRET="$(openssl rand -hex 32)"
  # In-place edit. Both BSD (macOS) and GNU sed accept `-i ''` syntax
  # the same way through bash escaping; use a tmp file to stay portable.
  TMP_FILE="$(mktemp)"
  awk -v secret="$SECRET" '/^SESSION_JWT_SECRET=\s*$/ { print "SESSION_JWT_SECRET=" secret; next } { print }' "$API_ENV" > "$TMP_FILE"
  mv "$TMP_FILE" "$API_ENV"
  echo "✓ generated apps/api SESSION_JWT_SECRET (32 bytes / 64 hex chars)"
else
  echo "· SESSION_JWT_SECRET already set — leaving it alone"
fi

echo ""
echo "Next steps:"
echo "  1. pnpm dev:mongo:up   # start the MongoDB container (apps/api dependency)"
echo "  2. pnpm ha:up          # start the HA dev container (Phase 2 OAuth/WS)"
echo "  3. pnpm dev            # boot the full monorepo"
