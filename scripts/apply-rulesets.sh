#!/usr/bin/env bash
# Apply branch protection rulesets to this repo using gh CLI.
#
# Requirements:
#   - gh CLI authenticated with a token that has admin:repo scope.
#   - jq on $PATH.
#
# Usage:
#   scripts/apply-rulesets.sh
#
# Idempotent: a ruleset with the same "name" gets updated; otherwise created.

set -euo pipefail

OWNER="${GLAON_OWNER:-toss-cengiz}"
REPO="${GLAON_REPO:-glaon}"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
rulesets_dir="$script_dir/../.github/rulesets"

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required on \$PATH" >&2
  exit 1
fi

apply_ruleset() {
  local file="$1"
  local name
  name=$(jq -r '.name' "$file")
  printf 'Applying ruleset: %s\n' "$name"

  local existing_id
  existing_id=$(gh api "repos/$OWNER/$REPO/rulesets" --jq ".[] | select(.name == \"$name\") | .id" || true)

  if [[ -n "$existing_id" ]]; then
    gh api --method PUT "repos/$OWNER/$REPO/rulesets/$existing_id" --input "$file" >/dev/null
    printf '  → updated (id: %s)\n' "$existing_id"
  else
    gh api --method POST "repos/$OWNER/$REPO/rulesets" --input "$file" >/dev/null
    printf '  → created\n'
  fi
}

for file in "$rulesets_dir"/*.json; do
  apply_ruleset "$file"
done

printf '\nDone. Current rulesets on %s/%s:\n' "$OWNER" "$REPO"
gh api "repos/$OWNER/$REPO/rulesets" --jq '.[] | "  - \(.name) (\(.enforcement))"'
