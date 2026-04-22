#!/usr/bin/env bash
# Apply repository-level merge-method settings using gh CLI.
#
# Requirements:
#   - gh CLI authenticated with a token that has admin:repo scope.
#
# Usage:
#   scripts/apply-repo-settings.sh
#
# Idempotent: PATCH resets settings to the desired values on every run.
#
# What this enforces:
#   - allow_squash_merge:  true  (default merge method)
#   - allow_rebase_merge:  true  (for PRs already carrying the exact commit)
#   - allow_merge_commit:  false (required_linear_history forbids merge commits)
#   - squash title:        PR_TITLE  (PR title becomes commit subject)
#   - squash body:         PR_BODY   (PR body becomes commit body)
#
# PR title/body format matters because release-please reads the squash commit
# on development/main to produce the release — the subject must be a valid
# Conventional Commit (feat:, fix:, refactor!:, ...).

set -euo pipefail

OWNER="${GLAON_OWNER:-toss-cengiz}"
REPO="${GLAON_REPO:-glaon}"

printf 'Applying repo merge-method settings...\n'

gh api --method PATCH "repos/$OWNER/$REPO" \
  -F allow_squash_merge=true \
  -F allow_rebase_merge=true \
  -F allow_merge_commit=false \
  -F squash_merge_commit_title=PR_TITLE \
  -F squash_merge_commit_message=PR_BODY \
  --jq '{
    allow_squash_merge,
    allow_rebase_merge,
    allow_merge_commit,
    squash_merge_commit_title,
    squash_merge_commit_message
  }' | jq -r '
    "  allow_squash_merge:  \(.allow_squash_merge)",
    "  allow_rebase_merge:  \(.allow_rebase_merge)",
    "  allow_merge_commit:  \(.allow_merge_commit)",
    "  squash_title:        \(.squash_merge_commit_title)",
    "  squash_body:         \(.squash_merge_commit_message)"
  '

printf 'Done.\n'
