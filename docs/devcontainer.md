# Dev Container

Glaon'un lokal geliştirme ortamı `.devcontainer/devcontainer.json` ile pinlenmiştir. Amaç: yeni bir katkıcı clone'dan ilk `pnpm dev`'e kadar sadece **iki komut** uzakta olsun (reopen-in-container + onay) — Node/pnpm sürüm uyuşmazlığı, eksik Docker, unutulmuş `gh` CLI gibi "benim makinemde çalışıyor" sınıfı problemler ortadan kalksın.

## Hızlı başlangıç

### VS Code (lokal) ile

1. **Dev Containers** eklentisini kur: `ms-vscode-remote.remote-containers`.
2. Repo'yu klonla ve VS Code'da aç.
3. Command Palette → **Dev Containers: Reopen in Container**.
4. Container inşa olur; `postCreateCommand` `pnpm install --frozen-lockfile` koşar.
5. Hazır: `pnpm dev`, `pnpm test`, `pnpm --filter @glaon/ui storybook`.

### GitHub Codespaces ile

1. Repo sayfasında **Code → Codespaces → Create codespace on development**.
2. Container aynı `devcontainer.json`'ı kullanır; extension'lar ve post-create aynı akışı izler.
3. Forwarded port'ları (5173, 6006, 8099) Codespaces UI otomatik expose eder.

## İçinde ne var?

| Bileşen            | Nereden                                                         | Niye                                                                                                |
| ------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Node 22 LTS        | `mcr.microsoft.com/devcontainers/typescript-node:22` base image | `.nvmrc` ile aynı major; TypeScript + Node dev tooling pre-installed                                |
| pnpm 9.15.0        | `corepack enable` (post-create)                                 | `package.json`'daki `packageManager` alanına göre pin — versiyon sürüklenmesi yok                   |
| Docker (dış motor) | `ghcr.io/devcontainers/features/docker-outside-of-docker`       | `addon/` HA Add-on build'inde `docker buildx` host daemon'ını kullanır — container-in-container yok |
| GitHub CLI         | `ghcr.io/devcontainers/features/github-cli`                     | `gh pr create`, `gh issue`, `gh run` akışları CLAUDE.md'deki issue-first iş akışının parçası        |

## Port'lar

| Port | Ne için?                                        | Auto-forward |
| ---- | ----------------------------------------------- | ------------ |
| 5173 | Vite dev server (web)                           | notify       |
| 6006 | Storybook                                       | notify       |
| 8099 | HA add-on nginx (lokal add-on test'i için)      | silent       |
| 8123 | Lokal Home Assistant dev fixture (`pnpm ha:up`) | notify       |

Codespaces otomatik HTTPS proxy URL'si üretir; lokal container'da `localhost:<port>` ile erişilir. 8123 dev fixture'ı için ayrıntı: [docs/home-assistant-dev.md](home-assistant-dev.md). Container `docker-outside-of-docker` ile host daemon'ı kullandığı için `pnpm ha:up` Dev Container'ın **içinden de** koşar.

## VS Code extension'ları

Container açıldığında otomatik önerilen extension'lar:

- **ESLint** (`dbaeumer.vscode-eslint`) — `@glaon/config`'tan gelen flat config'i okur.
- **Prettier** (`esbenp.prettier-vscode`) — `.prettierrc` + format-on-save aktif.
- **Playwright** (`ms-playwright.playwright`) — E2E test'lerini VS Code içinden koş/debug et.
- **Vitest Explorer** (`vitest.explorer`) — unit + story test'lerini tree view'la çalıştır.
- **Docker** (`ms-azuretools.vscode-docker`) — add-on Dockerfile'ları + host daemon bağlantısı.
- **GitHub Pull Requests** (`github.vscode-pull-request-github`) — `gh` CLI'ye ek olarak review ve PR akışı.

Settings katmanı: `formatOnSave: true`, Prettier default formatter, TypeScript SDK'sı `node_modules/typescript/lib`'ten (workspace sürümüyle uyumlu).

## Doğrulama akışı

Container ilk açıldığında aşağıdakilerin geçmesi beklenir — geçmiyorsa container kurulumu bozuk demektir:

```bash
pnpm install --frozen-lockfile  # post-create zaten koşmuş olmalı, tekrar çalışmalı
pnpm type-check
pnpm lint
pnpm build
```

## Neden "outside of docker"?

Add-on build'i için `docker buildx` gerekli. Container-in-container (DinD) çok daha ağır ve permissions hassas; host daemon'a socket mount etmek hem hızlı hem açık. Güvenlik notu: bu şemada container host daemon üzerinde tam yetkiyle konuşur — shared/CI ortamlarda DinD tercih edilebilir, ama tek developer'ın kendi Codespaces/laptop'unda tipik akış "outside".

## Kapsam dışı

- Expo / React Native **emulator** container-içi desteği — hâlâ host-side: simulator (iOS) ve Android emulator macOS/Linux host üzerinde koşar. `apps/mobile` için `pnpm --filter @glaon/mobile dev` container dışında çalıştırılır. Bu tutarlı bir follow-up: mobile build container'ı ayrı bir iş (ayrı issue).
- GHCR'ye push edilmiş pre-built image — startup time bir problem olana kadar plain `devcontainer.json` yeterli. İleride `devcontainer.image.ref` ile bu dosyada tek satır değişecek.
- `*.local` mDNS resolution — dev container içinden `homeassistant.local` çözmek host network gerektirir; lokal HA fixture'ı `localhost:8123` üzerinden konuştuğu için dev'de gerekli değil. Lokal keşfin gerçek ortam davranışı [docs/home-assistant-dev.md → Lokal keşif](home-assistant-dev.md#lokal-keşif-local-çözümlemesi) ve [ADR 0024](adr/0024-local-discovery-rely-on-ha-hostname.md) altında.

## Sorun giderme

- **`corepack: not found`** → Base image Node 22 ile geliyor, corepack yerleşik olmalı. Image versiyonunu doğrula: `cat /etc/os-release` + `node --version`.
- **`pnpm install` lockfile'ı reddediyor** → Host'ta `pnpm install` yapmışsan `node_modules/` ve `pnpm-lock.yaml` eşleşmeyebilir; container rebuild → `pnpm install --frozen-lockfile` temiz koşmalı.
- **Docker daemon erişimi yok** → `docker-outside-of-docker` feature'ı host socket'i mount ediyor; Codespaces'te bu otomatik, lokalde Docker Desktop'un "Use the WSL 2 based engine" veya equivalent ayarı açık olmalı.
- **Port 5173/6006 forward olmuyor** → VS Code **Ports** tab'inde manuel ekleyebilirsin; `forwardPorts` sadece default listesi.
