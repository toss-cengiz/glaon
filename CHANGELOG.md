# Changelog

## [0.1.1](https://github.com/toss-cengiz/glaon/compare/v0.1.0...v0.1.1) (2026-04-22)


### Documentation

* adopt Issue-First workflow rule in CLAUDE.md ([7b61cb2](https://github.com/toss-cengiz/glaon/commit/7b61cb278ab13054515fc8762a209c6537e6c25c)), closes [#2](https://github.com/toss-cengiz/glaon/issues/2)


### Chores

* bootstrap Glaon monorepo ([03ce903](https://github.com/toss-cengiz/glaon/commit/03ce903fea620b1971beb9887165fe2ad724e62e))
* **deps:** upgrade to React 19 latest ([d4a7bec](https://github.com/toss-cengiz/glaon/commit/d4a7bec407f601f82c203829b489fc37340eb174)), closes [#6](https://github.com/toss-cengiz/glaon/issues/6)
* gitignore .claude/settings.local.json ([9ebfba9](https://github.com/toss-cengiz/glaon/commit/9ebfba91da761aeb6b132c6f571b67489ce8a6c5))
* **main:** release 1.0.0 ([#126](https://github.com/toss-cengiz/glaon/issues/126)) ([a5a71a9](https://github.com/toss-cengiz/glaon/commit/a5a71a9acc6e110f7193d728fdb64e7208ebcf82))
* **release:** cut Phase 0 foundation (v0.1.0) ([#123](https://github.com/toss-cengiz/glaon/issues/123)) ([1edfe8c](https://github.com/toss-cengiz/glaon/commit/1edfe8c2889e9ca15408497dfee9cd8ad1cc33b2))

## 0.1.0 (2026-04-22)

Initial pre-release. Phase 0 establishes the foundation: monorepo scaffolding, security posture, CI/CD, observability plumbing, and governance. No end-user features yet — Home Assistant integration lands in subsequent phases.

### Features

- **ui:** set up Storybook 10 with Button primitive ([#41](https://github.com/toss-cengiz/glaon/issues/41)) ([f20f962](https://github.com/toss-cengiz/glaon/commit/f20f962))
- **ui:** add Storybook MCP addon and dark-mode toggle ([#41](https://github.com/toss-cengiz/glaon/issues/41)) ([2277b9c](https://github.com/toss-cengiz/glaon/commit/2277b9c))
- **ui:** React Native story support via react-native-web-vite ([#47](https://github.com/toss-cengiz/glaon/issues/47)) ([1a8999b](https://github.com/toss-cengiz/glaon/commit/1a8999b))
- **ci:** Chromatic visual regression workflow, CLI, and runbook ([#50](https://github.com/toss-cengiz/glaon/issues/50)) ([bcb299e](https://github.com/toss-cengiz/glaon/commit/bcb299e))
- **mcp:** bind Chromatic remote MCP endpoint via repo-scoped .mcp.json ([#54](https://github.com/toss-cengiz/glaon/issues/54)) ([0384ed4](https://github.com/toss-cengiz/glaon/commit/0384ed4))
- **ci:** Renovate for dependency freshness, widen audit to all deps ([#57](https://github.com/toss-cengiz/glaon/issues/57)) ([e71fff4](https://github.com/toss-cengiz/glaon/commit/e71fff4))
- **web:** wire Sentry SDK with platform-agnostic PII scrubber ([#79](https://github.com/toss-cengiz/glaon/issues/79)) ([600d2ed](https://github.com/toss-cengiz/glaon/commit/600d2ed))
- **mobile:** wire @sentry/react-native with shared core PII scrubber ([cfdf7dc](https://github.com/toss-cengiz/glaon/commit/cfdf7dc))
- **storybook:** enable addon-designs for Figma frame embeds ([#81](https://github.com/toss-cengiz/glaon/issues/81)) ([f812911](https://github.com/toss-cengiz/glaon/commit/f812911))
- **release:** attach SPDX SBOM artifacts to releases ([#99](https://github.com/toss-cengiz/glaon/issues/99)) ([388fb76](https://github.com/toss-cengiz/glaon/commit/388fb76))

### Bug Fixes

- **figma-plugin:** allow manifest import in Figma Dev Mode ([#85](https://github.com/toss-cengiz/glaon/issues/85)) ([cfa064c](https://github.com/toss-cengiz/glaon/commit/cfa064c))

### Performance

- **web:** add Lighthouse CI with performance budget ([#114](https://github.com/toss-cengiz/glaon/issues/114)) ([2fe2b82](https://github.com/toss-cengiz/glaon/commit/2fe2b82))

### Tests

- **e2e:** inject axe-core into Playwright smokes for runtime a11y ([06dc9a1](https://github.com/toss-cengiz/glaon/commit/06dc9a1))
- **storybook:** enable Storybook test-runner via Vitest browser mode ([f1c324b](https://github.com/toss-cengiz/glaon/commit/f1c324b))

### Documentation

- adopt branching + PR workflow ([#38](https://github.com/toss-cengiz/glaon/issues/38)) ([ff901e9](https://github.com/toss-cengiz/glaon/commit/ff901e9))
- adopt Issue-First workflow rule in CLAUDE.md ([#2](https://github.com/toss-cengiz/glaon/issues/2)) ([7b61cb2](https://github.com/toss-cengiz/glaon/commit/7b61cb2))
- **claude:** require PR body + test plan to stay in sync with scope ([bb32d69](https://github.com/toss-cengiz/glaon/commit/bb32d69))
- **chromatic:** scaffold placeholder for integration docs ([bf2af77](https://github.com/toss-cengiz/glaon/commit/bf2af77))
- **chromatic:** document Chromatic ↔ Figma design-code diff ([#53](https://github.com/toss-cengiz/glaon/issues/53)) ([4293f1a](https://github.com/toss-cengiz/glaon/commit/4293f1a))
- **figma:** establish Figma as the design source of truth ([#52](https://github.com/toss-cengiz/glaon/issues/52)) ([a503d6d](https://github.com/toss-cengiz/glaon/commit/a503d6d))
- **governance:** document merge-method policy + codify repo settings ([#76](https://github.com/toss-cengiz/glaon/issues/76)) ([9e0d2f0](https://github.com/toss-cengiz/glaon/commit/9e0d2f0))
- **adr:** scaffold ADR workflow + backfill Phase 0 decisions ([#105](https://github.com/toss-cengiz/glaon/issues/105)) ([467f340](https://github.com/toss-cengiz/glaon/commit/467f340))

### Continuous Integration

- bootstrap Glaon monorepo ([03ce903](https://github.com/toss-cengiz/glaon/commit/03ce903))
- **ci:** bootstrap monorepo cleanly with lockfile + lint fixes ([b21ea80](https://github.com/toss-cengiz/glaon/commit/b21ea80))
- **ci:** add Husky + lint-staged pre-commit hooks ([#4](https://github.com/toss-cengiz/glaon/issues/4)) ([9c37a99](https://github.com/toss-cengiz/glaon/commit/9c37a99))
- **security:** add gitleaks pre-commit hook + document local install ([#5](https://github.com/toss-cengiz/glaon/issues/5)) ([e544131](https://github.com/toss-cengiz/glaon/commit/e544131))
- automate releases via release-please + enforce Conventional Commits ([#40](https://github.com/toss-cengiz/glaon/issues/40)) ([701ceeb](https://github.com/toss-cengiz/glaon/commit/701ceeb))
- auto-close referenced issue on development merge ([#45](https://github.com/toss-cengiz/glaon/issues/45)) ([33a7ff7](https://github.com/toss-cengiz/glaon/commit/33a7ff7))
- **github:** add issue templates for feature / bug / chore / docs ([#71](https://github.com/toss-cengiz/glaon/issues/71)) ([0da45df](https://github.com/toss-cengiz/glaon/commit/0da45df))
- **governance:** codify branch protection, CODEOWNERS, PR template ([#69](https://github.com/toss-cengiz/glaon/issues/69)) ([85496a9](https://github.com/toss-cengiz/glaon/commit/85496a9))
- **test:** introduce Playwright E2E + mandatory smoke-per-feature rule ([7fe1015](https://github.com/toss-cengiz/glaon/commit/7fe1015))
- **release:** pin release-please action + first-release docs ([#77](https://github.com/toss-cengiz/glaon/issues/77)) ([b8a7dbd](https://github.com/toss-cengiz/glaon/commit/b8a7dbd))
- **addon:** wire HA Add-on skeleton + multi-arch build CI ([#86](https://github.com/toss-cengiz/glaon/issues/86)) ([f368d8d](https://github.com/toss-cengiz/glaon/commit/f368d8d))
- **security:** pin third-party GitHub Actions by commit SHA ([#106](https://github.com/toss-cengiz/glaon/issues/106)) ([6b224e5](https://github.com/toss-cengiz/glaon/commit/6b224e5))
- **security:** add Dependency Review Action for PR-time vuln check ([#107](https://github.com/toss-cengiz/glaon/issues/107)) ([535d902](https://github.com/toss-cengiz/glaon/commit/535d902))
- **security:** enable CodeQL SAST on CI ([#108](https://github.com/toss-cengiz/glaon/issues/108)) ([c80a4d2](https://github.com/toss-cengiz/glaon/commit/c80a4d2))
- **testing:** scaffold Vitest unit test infrastructure ([#109](https://github.com/toss-cengiz/glaon/issues/109)) ([8e3eb74](https://github.com/toss-cengiz/glaon/commit/8e3eb74))
- **monorepo:** enforce cross-workspace dep version consistency with syncpack ([#110](https://github.com/toss-cengiz/glaon/issues/110)) ([9e9e63e](https://github.com/toss-cengiz/glaon/commit/9e9e63e))
- **monorepo:** add knip for unused files, deps, and imports check ([#111](https://github.com/toss-cengiz/glaon/issues/111)) ([9023fe2](https://github.com/toss-cengiz/glaon/commit/9023fe2))
- **packages:** validate exports with publint + arethetypeswrong ([#112](https://github.com/toss-cengiz/glaon/issues/112)) ([7690391](https://github.com/toss-cengiz/glaon/commit/7690391))
- **web:** add size-limit bundle budget enforced in CI ([#113](https://github.com/toss-cengiz/glaon/issues/113)) ([02c688c](https://github.com/toss-cengiz/glaon/commit/02c688c))
- **security:** enable OSSF Scorecard supply-chain score ([#98](https://github.com/toss-cengiz/glaon/issues/98)) ([8fec088](https://github.com/toss-cengiz/glaon/commit/8fec088))
- wire Turborepo remote cache via TURBO_TOKEN + TURBO_TEAM ([#88](https://github.com/toss-cengiz/glaon/issues/88)) ([56988f3](https://github.com/toss-cengiz/glaon/commit/56988f3))
- **dev:** add VSCode Dev Container config for reproducible dev env ([#117](https://github.com/toss-cengiz/glaon/issues/117)) ([917d2f3](https://github.com/toss-cengiz/glaon/commit/917d2f3))
- skip commitlint on release PRs targeting main ([#124](https://github.com/toss-cengiz/glaon/issues/124)) ([fab083c](https://github.com/toss-cengiz/glaon/commit/fab083c))

### Chores

- upgrade to React 19 latest ([#6](https://github.com/toss-cengiz/glaon/issues/6)) ([d4a7bec](https://github.com/toss-cengiz/glaon/commit/d4a7bec))
- gitignore .claude/settings.local.json ([9ebfba9](https://github.com/toss-cengiz/glaon/commit/9ebfba9))
- apply prettier across the repo ([655b2e2](https://github.com/toss-cengiz/glaon/commit/655b2e2))
- **deps:** bump vite from 5.4.21 to 6.4.2 ([#82](https://github.com/toss-cengiz/glaon/issues/82)) ([4ab7e6d](https://github.com/toss-cengiz/glaon/commit/4ab7e6d))
- **config:** migrate config renovate.json ([7f39c7e](https://github.com/toss-cengiz/glaon/commit/7f39c7e))
- **claude:** add brand-design skill + Figma plugin scaffold ([#83](https://github.com/toss-cengiz/glaon/issues/83)) ([826a68d](https://github.com/toss-cengiz/glaon/commit/826a68d))
- **github:** enable blank issues + contact links, unify CLAUDE.md refs ([7653bae](https://github.com/toss-cengiz/glaon/commit/7653bae))
- **labels:** shift phases for phase-1 Design slot ([#122](https://github.com/toss-cengiz/glaon/issues/122)) ([0dc37a2](https://github.com/toss-cengiz/glaon/commit/0dc37a2))
