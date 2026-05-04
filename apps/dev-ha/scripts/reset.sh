#!/usr/bin/env bash
# Stop the dev Home Assistant container and wipe its config so the next
# `pnpm ha:up` starts from a fresh onboarding state. The seeded
# configuration.yaml and .gitignore are preserved.
set -euo pipefail

DEV_HA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$DEV_HA_DIR/docker-compose.yml"
CONFIG_DIR="$DEV_HA_DIR/config"

docker compose -f "$COMPOSE_FILE" down

find "$CONFIG_DIR" -mindepth 1 \
  -not -name configuration.yaml \
  -not -name .gitignore \
  -delete

echo "Glaon dev HA reset. Run 'pnpm ha:up' to start fresh."
