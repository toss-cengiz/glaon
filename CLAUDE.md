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

## Storybook Rule (MANDATORY)

- Every new UI component (web or mobile) ships in the same PR with at least one Storybook story. No story, no merge.
- Stories live next to the component as `<Component>.stories.tsx` using CSF 3.0.
- Minimum per component: default state + at least one edge case (disabled / loading / error / empty, whichever applies).
- Accessibility: `@storybook/addon-a11y` is enabled with `a11y.test: 'error'`. Don't silently disable; document any intentional exception inline.
- Prop or variant additions to an existing component must update the corresponding stories in the same PR.
- Details and conventions: [docs/storybook.md](docs/storybook.md).

## Commits

- Conventional Commits style (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- English subject, imperative mood, ≤72 chars.
- Body explains the _why_ when non-obvious.

## Tooling

- `pnpm type-check` and `pnpm lint` must pass before commit.
- Do not install packages on the user's behalf without asking. Scaffolds can declare dependencies; actual install is the user's decision.
- Do not run `pnpm audit --fix` or similar destructive commands unprompted.

## Home Assistant Notes

- WebSocket protocol: https://developers.home-assistant.io/docs/api/websocket
- OAuth2 docs: https://developers.home-assistant.io/docs/auth_api
- HA only accepts client_id values that are valid URLs pointing to the redirect destination host.
