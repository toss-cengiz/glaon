# Glaon — Claude Code Conventions

Secure custom frontend for Home Assistant. Web + wall tablet + mobile from a single monorepo.

## Stack

- Turborepo + pnpm workspaces (pnpm 9, Node 22 LTS)
- Web: Vite + React 19 + TypeScript strict
- Mobile: Expo SDK 54 + React 19 + React Native 0.81 (new architecture on)
- Shared core: `@glaon/core` (platform-agnostic, no DOM / no RN imports)
- UI: `@glaon/ui` wraps the licensed Untitled UI React kit (not committed)
- Backend: Home Assistant, consumed via OAuth2 Authorization Code + PKCE and the WebSocket API
- Delivery: `addon/` packages the web app as a HA Add-on served over Ingress

## Language Policy

- **Code, code comments, commit messages, PR titles/bodies: English.**
- **User-facing docs under `docs/` and `README.md`: Turkish.**
- Conversation with the user in this repo: Turkish.

## Issue-First Rule (MANDATORY)

**No work starts without a GitHub issue.** Every code change, doc edit, config tweak, refactor, or upgrade must have a tracking issue created _before_ work begins.

- Check for an existing issue first (`gh issue list` or GitHub MCP).
- If none exists, open one, communicate the number to the user, _then_ touch code.
- Commits and PRs must reference the issue: `Refs #N` in the body, `Closes #N` for the final PR.
- Applies to tiny fixes too. The only exception is repository bootstrap work.

## Branching and PR Workflow (MANDATORY)

- Integration branch: `development`. Release branch: `main`.
- Every issue gets its own branch off `development`. Branch name: `<issue-number>-<short-kebab-slug>` (e.g. `7-oauth2-web-flow`).
- Never branch from `main` for feature work; never commit directly to `main` or `development`.
- PRs always target `development`. Base flag: `gh pr create --base development`.
- The user reviews and merges the PR. **Claude does not run `gh pr merge`** unless explicitly told to.
- `development → main` merges happen only during release cycles, in a separate PR.
- Standard start-of-work sequence:
  ```bash
  git switch development && git pull
  git switch -c <issue>-<slug>
  ```

## CI-Green-Before-Done Rule (MANDATORY)

- After `gh pr create` or any `git push` to a PR branch, watch CI with `gh pr checks <N> --watch`.
- If a check fails, read logs (`gh run view <id> --log-failed`), fix the root cause on the same branch, commit, push, and keep watching.
- Do not declare the work ready for review while checks are red or pending.
- For flaky CI, try `gh run rerun` once, but resolve persistent failures with code changes — never by disabling the check.

## Chromatic Visual Regression (MANDATORY)

- Every PR runs Chromatic as a required status check. The workflow is configured with `exitZeroOnChanges: false`, so any pixel-level change blocks merge until resolved.
- When the check is red:
  - Unintended regression → fix in code, push again.
  - Intentional visual change → open the Chromatic build, review the diff, click **Accept**. Never work around the check by tweaking `.github/workflows/chromatic.yml` or suppressing stories.
- `development` is the baseline branch (`autoAcceptChanges: development`). Story changes merged into `development` become the new baseline automatically.
- Skip list: `dependabot/**` and `release-please--**`. Other bot branches should not be added without discussion.
- `CHROMATIC_PROJECT_TOKEN` secret and branch protection rules are user-managed; see [docs/chromatic.md](docs/chromatic.md).
- Chromatic MCP: after the first successful publish, the remote endpoint exposes only `docs` tools. Dev/test tools stay on the local Storybook server — don't try to replicate them remotely.
- The Chromatic MCP entry in `.mcp.json` is part of the repo contract — don't edit or remove it as a drive-by. New MCP servers get their own entry and their own issue; breaking changes to the existing Chromatic URL require a tracked migration PR.

## PR Scope & Test Plan Sync (MANDATORY)

- The PR body is a live document, not a one-shot write. Whenever scope shifts during development — new dependency added, feature added or removed, deferred item pulled in, something moved to a follow-up issue — update the PR body in the same push.
- The **Scope** (In / Out) lists and the **Test plan** checklist must match the current diff at all times. A reviewer reading only the PR body should be able to reproduce the verification without surprises.
- New work gets new test plan items. Removed work gets deleted from the plan — don't leave stale unchecked boxes.
- Keep the tracking issue in sync too: if the In/Out split changed, amend the issue body or drop a comment so the issue remains the single source of truth.
- Practical trigger: right before `git push`, re-read the PR body and ask "does this still describe what I'm pushing?" — if not, `gh pr edit --body-file` first.

## PR Merge Hygiene (MANDATORY)

- Every PR body must contain a `Closes #N` (or `Fixes #N` / `Resolves #N`) reference to the tracking issue. This is the contract that drives all post-merge automation and makes the link show up in the PR's **Development** sidebar.
- `development` is the repo default branch (pre-v1.0 convention). GitHub's built-in closing-keyword behaviour therefore fires on every feature PR merge: the referenced issue is auto-closed with a back-reference to the PR. No custom workflow is needed.
- When the issue closes, the "Glaon Roadmap" project moves it to **Done** via the built-in Project v2 workflow ("Item closed → Status: Done"). If this workflow is ever disabled, re-enable it in the project UI — do not bypass by editing statuses manually.
- Feature branches are auto-deleted on merge (repo setting `delete_branch_on_merge: true`). Do not recreate branches with the same name after merge; open a fresh issue + fresh branch.
- A PR that omits `Closes #N` is a workflow bug, not a minor oversight — amend the body before merging.
- Release PRs (`development → main`) target the non-default branch; they do not auto-close issues via keyword. Release-please manages the release itself.

## Security-First Rules

- No `localStorage` for tokens on web. In-memory + httpOnly cookie, or SecureStore on mobile.
- No `dangerouslySetInnerHTML`. Render HA-derived content as text.
- CSP must stay restrictive — `default-src 'self'`, no `unsafe-eval`.
- No `any`, no `ts-ignore` without a comment explaining the justification.
- Secrets live in `.env`; only `.env.example` is committed.
- Run the `security-review` skill on any PR that touches auth, storage, network, or crypto.

## Package Boundaries

- `@glaon/core` must be importable from both web and React Native. No `window`, no `document`, no `react-native`. Use Web Crypto + fetch + WebSocket (all available in both runtimes).
- Platform-specific code (SecureStore, WebBrowser, expo-auth-session, DOM APIs) lives in `apps/*`.
- `@glaon/ui` is the only place that imports Untitled UI source.

## Design Source of Truth (MANDATORY)

- Figma is the canonical source for Glaon's design: colors, spacing, typography, shadow, component visuals, and screen mockups all live there. Code **references** this source — it does not invent parallel values.
- Design tokens are not hand-typed. They are exported from Figma Variables via the Figma Tokens plugin, committed as JSON, and transformed by Style Dictionary into per-platform outputs. Hex codes and raw spacing numbers don't appear in component code; token references do.
- New primitives are designed in Figma first. A code-only primitive without a Figma counterpart is not mergeable — design review gate applies before the Storybook story is written.
- Figma component descriptions carry the Storybook component ID in the form `storybook-id: <kebab-case>`. This is the contract that Chromatic's Figma plugin (#53) relies on; don't change the format without coordinating that integration.
- Setup and workflow details: [docs/figma.md](docs/figma.md).

## Storybook Rule (MANDATORY)

- Every new UI component (web or mobile) ships in the same PR with at least one Storybook story. No story, no merge.
- Stories live next to the component as `<Component>.stories.tsx` using CSF 3.0.
- Minimum per component: default state + at least one edge case (disabled / loading / error / empty, whichever applies).
- Accessibility: `@storybook/addon-a11y` is enabled with `a11y.test: 'error'`. Don't silently disable; document any intentional exception inline.
- Prop or variant additions to an existing component must update the corresponding stories in the same PR.
- Details and conventions: [docs/storybook.md](docs/storybook.md).

## Commits

- Conventional Commits style (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `ci:`, `build:`, `style:`).
- English subject, imperative mood, ≤72 chars.
- Body explains the _why_ when non-obvious.
- Release automation reads commit messages. `feat:` bumps MINOR, `fix:`/`perf:`/`refactor:` bump PATCH, `feat!:` or a `BREAKING CHANGE:` footer bumps MAJOR. See `docs/release.md`.
- `commitlint` runs in CI on every PR (`@commitlint/config-conventional`). Non-conforming commits fail the check — rewrite history on the feature branch before re-pushing.

## Tooling

- `pnpm type-check` and `pnpm lint` must pass before commit.
- Do not install packages on the user's behalf without asking. Scaffolds can declare dependencies; actual install is the user's decision.
- Do not run `pnpm audit --fix` or similar destructive commands unprompted.

## Dependency Freshness (MANDATORY)

- [Renovate](renovate.json) keeps dependencies current. It runs on a schedule (Monday mornings), opens grouped update PRs, and auto-merges patch + devDep-minor bumps once CI is green. Security advisories bypass the schedule.
- The repo's **Dependency Dashboard** issue (auto-created by Renovate, labeled `dependencies`) is the single tracking issue for all automated update work. This is the Issue-First Rule's recognized exception — Renovate PRs reference the dashboard, no extra issue per update.
- Don't bump package versions by hand as a drive-by. If Renovate has an open PR or a dashboard item for the dep you're about to touch, use that instead. Manual bumps are reserved for (a) resolving a specific bug, (b) unblocking migration work that has its own issue, or (c) a pin/rollback covered in [docs/dependencies.md](docs/dependencies.md).
- CI enforces `pnpm audit --audit-level high`. High + critical severity vulnerabilities fail the build. Don't weaken the audit level to silence a finding — patch the dep (or open an issue to pin around it).
- Major version bumps always require human review: Renovate lists them in the dashboard with approval-needed, and they only turn into PRs after the dashboard checkbox is ticked.

## Home Assistant Notes

- WebSocket protocol: https://developers.home-assistant.io/docs/api/websocket
- OAuth2 docs: https://developers.home-assistant.io/docs/auth_api
- HA only accepts client_id values that are valid URLs pointing to the redirect destination host.
