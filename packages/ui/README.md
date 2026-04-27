# @glaon/ui

Glaon'un primitive component kütüphanesi. Web (Vite/React 19) ve mobil (Expo/RN) consumer'ların tükettiği Storybook-tabanlı paket. Lisanslı **Untitled UI React kit**'in headless layer'ını wrap eder ve Figma'dan export edilen Glaon design token'larıyla yeniden temalar.

Kararın gerekçesi: [ADR 0011 — Untitled UI React kit + GitHub Packages delivery](../../docs/adr/0011-untitled-ui-react-kit.md).

## Untitled UI React kit — kurulum

Kit lisanslı ve kapalı kaynak. Source code repo'ya commit **edilmez** (Glaon repo'su public). Kit, Glaon org'unun **GitHub Packages private npm registry**'sine paketlenir; `pnpm install` registry'den çeker.

### Per-developer setup (yeni geliştirici onboarding)

1. **GitHub Personal Access Token (PAT) oluştur**:
   - <https://github.com/settings/tokens> → Fine-grained veya Classic.
   - Scope: `read:packages` (yeterli; başka yetki gerekmez).
   - Expiry: ekibin politikasına göre (90 gün önerilir).
2. **`~/.npmrc`'ye ekle** (lokal, repo dışı):
   ```ini
   //npm.pkg.github.com/:_authToken=ghp_xxxxxxxxxxxxxxxxxxxx
   ```
   Bu satır yalnızca senin makinende kalır; **asla repo'ya commit etme**. Repo'nun root'undaki `.npmrc` (commit edilmiş) sadece scope → registry mapping'i içerir, token taşımaz.
3. **`pnpm install`**: Kit otomatik olarak çekilir. 401 alıyorsan PAT scope'unu (`read:packages`) ve expiry'sini kontrol et.

### CI auth (otomatik)

`.github/workflows/*.yml` içinde `actions/setup-node` adımı `registry-url: https://npm.pkg.github.com` ile authenticate eder; `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` env var ile auth. `GITHUB_TOKEN` her workflow'da otomatik mevcut, ek secret kurulumu gerekmez.

### Kit version bump'ları

- Renovate `dependencies` dashboard'unda kit guncellemelerini izler. Patch + minor otomatik PR; major manuel approval.
- Manuel bump'lar drive-by yapılmaz — Renovate dashboard'undaki entry tetikler.
- Lokal'de güncelleme test edildiğinde `pnpm --filter @glaon/ui add @<scope>/<package>@latest` ile, ardından `pnpm install` lockfile'ı senkronlar.

## Lisans / attribution

`@glaon/ui`, Untitled UI'nin React kit'ini ticari lisans altında kullanır. Lisans şartları kit publisher'ı tarafından belirlenir; her release Brand Guideline Cover sayfasında ve bu README'de atıf paragrafıyla taşınır:

> Bu paket, Untitled UI tarafından sağlanan licensed React component kit'ini barındırır. Kit'in source code'u Glaon org'unun GitHub Packages private registry'sinde tutulur, public dağıtım yapılmaz. Lisans şartları için Untitled UI'nin license belgesine bakınız.

## Component yetiştirme akışı

Yeni primitive eklenmesi:

1. **Figma'da tasarla** (Design System dosyasında, [docs/design-system-bootstrap.md](../../docs/design-system-bootstrap.md)).
2. **`packages/ui/src/components/<Name>/`** altında:
   - `<Name>.tsx` — web (DOM-tabanlı) implementation.
   - `<Name>.native.tsx` — RN implementation (gerekiyorsa).
   - `<Name>.types.ts` — shared prop sözleşmesi.
   - `<Name>.stories.tsx` — Storybook story'leri.
   - `index.ts` — re-export.
3. **Token tüket**: `dist/tokens/web.css` (CSS vars) veya `dist/tokens/rn.ts` (typed object). Hex / raw px yazmak yasak — [CLAUDE.md "Design Source of Truth"](../../CLAUDE.md#design-source-of-truth-mandatory).
4. **Storybook**: addon-a11y (error level), addon-designs (Figma embed), addon-vitest (browser tests). Story coverage: default + en az bir edge case ([docs/storybook.md](../../docs/storybook.md)).
5. **Barrel**: `packages/ui/src/index.ts`'i güncelle.

## Komutlar

```bash
pnpm --filter @glaon/ui storybook        # localhost:6006
pnpm --filter @glaon/ui build:tokens     # tokens/*.json → dist/tokens/{web.css,rn.ts}
pnpm --filter @glaon/ui build            # tsc -b
pnpm --filter @glaon/ui test             # Vitest unit
pnpm --filter @glaon/ui test:stories     # Vitest browser (Playwright)
pnpm --filter @glaon/ui chromatic        # visual regression upload
pnpm --filter @glaon/ui type-check
pnpm --filter @glaon/ui lint
```

## Sorun giderme

- **`pnpm install` 401 / 404 (kit paketi)**: PAT eksik veya scope yanlış. `~/.npmrc`'de `//npm.pkg.github.com/:_authToken=...` satırı var mı; PAT'ın `read:packages` scope'u set mi.
- **CI'da auth hatası**: Workflow'da `actions/setup-node`'un `registry-url` parametresi set mi; `NODE_AUTH_TOKEN` env var `GITHUB_TOKEN`'a bağlı mı.
- **Hex/px literal lint hatası**: Component dosyasında token yerine raw değer var. F2 üretimi `dist/tokens/{web.css,rn.ts}`'dan ilgili token'ı tüket.
- **Storybook a11y panel'i `error` veriyor**: `addon-a11y` `a11y.test: 'error'` ile aktif; merge için yeşil olmalı. İstisnai durumlarda inline doc + scope-narrow `parameters.a11y.config.rules`.

## Referanslar

- [ADR 0011 — Untitled UI React kit + GitHub Packages delivery](../../docs/adr/0011-untitled-ui-react-kit.md)
- [docs/storybook.md](../../docs/storybook.md) — story conventions + addons.
- [docs/figma.md](../../docs/figma.md) — tasarım kaynağı + plugin bridge.
- [docs/design-system-bootstrap.md](../../docs/design-system-bootstrap.md) — Figma file yapısı + primitive yetiştirme.
- [packages/ui/tokens/README.md](tokens/README.md) — design token export + schema.
