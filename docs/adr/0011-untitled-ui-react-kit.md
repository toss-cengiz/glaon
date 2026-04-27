# ADR 0011 — Untitled UI React kit'i `@glaon/ui` paketinin tabanı + GitHub Packages private registry üzerinden delivery

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-27
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue #14, [docs/figma.md](../figma.md), [packages/ui/README.md](../../packages/ui/README.md), [docs/design-system-bootstrap.md](../design-system-bootstrap.md)

## Bağlam

Glaon'un `@glaon/ui` paketi, web ve mobil consumer'ların tükettiği primitive component katmanını barındırır. Phase 1 boyunca on'a yakın primitive (Button, Input, Modal, Drawer, Popover, Tooltip, Select, Tabs vs.) kod tarafına gelir; her birinin a11y, focus-trap, portal ve keyboard kontrolü ciddi yatırım gerektirir.

Kararı şekillendiren kısıtlar:

- **Lisans gerçeği**: Untitled UI React kit ücretli, kapalı kaynak bir kit. Source code'u public bir repoya commit etmek lisans ihlali. Glaon repo'su (`toss-cengiz/glaon`) public.
- **CI ihtiyacı**: Storybook build, Chromatic visual regression, Vitest browser tests her PR'da koşar — kit her CI run'unda erişilebilir olmalı.
- **Onboarding eşiği**: Yeni geliştirici lokal'de Storybook'u 5 dakikada çalıştırabilmeli; auth/registry adımı dokümante ve mekanik olmalı.
- **Versioning + güvenlik**: Kit güncellemeleri trace edilebilir olmalı (Renovate dashboard'da görünmeli, breaking change'ler PR review'dan geçmeli, security advisory'leri yakalansın).
- **Phase 1 plan**: F3 (#14) "Untitled UI React kit'i `@glaon/ui`'ye entegre et"; F5+ primitive PR'ları kit'in sağladığı headless layer'ı tüketir.

Göz önünde bulundurulan alternatifler:

- **Seçenek A — Source vendor (`packages/ui/vendor/untitled-ui/`)**: Kit'i source olarak commit et. Lisans ihlali; public repo'da yayımlanmış olur. Eleminate.
- **Seçenek B — Public npm clone**: Kit'i public bir npm paketi olarak yeniden yayınla. Lisans açıkça yasaklıyor. Eleminate.
- **Seçenek C — Private Git submodule**: Org altında private bir `glaon-uui-vendor` repo'sunda kit'i tut, ana repo'da submodule olarak çek. Çalışır; deploy key ile CI auth basit. Ama: kit upgrade'i manuel iki commit (vendor repo + submodule pointer), Renovate native submodule update'i sınırlı, iki repo bakımı yükü.
- **Seçenek D — GitHub Packages private npm registry (seçilen)**: Kit'i `toss-cengiz` org'una private GitHub package olarak publish. `npm install` ile çek; `.npmrc` registry mapping repo'ya commit; auth token (PAT lokal'de, `GITHUB_TOKEN` CI'da) commit edilmez. Karar bölümünde detay.

## Karar

`@glaon/ui` Untitled UI React kit'i bir devDependency olarak tüketir. Kit, `toss-cengiz` org'unun private GitHub Packages npm registry'sine paketlenmiş haliyle yüklenir; ne `node_modules` ne de source kit'in hiçbir parçası ana repo'ya commit edilmez. Component implementasyonları kit primitive'lerini wrap eder, Glaon design token'larıyla yeniden temalar.

Kararın teknik detayları:

- **Paket adı**: `@<org>/<kit-paket-adi>` (kesin isim F3-B PR'ında, yayın anında belirlenir; bu ADR pattern'i belgelendirir).
- **Registry**: `https://npm.pkg.github.com` — GitHub Packages npm endpoint'i.
- **`.npmrc`**: Repo-scoped, scope → registry mapping satırı içerir; auth token içermez. Per-developer PAT `~/.npmrc`'de yaşar.
- **Per-developer kurulum**: README runbook'unda dokümante. PAT scope: `read:packages`.
- **CI auth**: Workflow'lar `actions/setup-node` adımında `registry-url: https://npm.pkg.github.com` set eder; `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` env var ile authenticate. `GITHUB_TOKEN` zaten her workflow'da otomatik mevcut, ek secret gerekmez.
- **Versioning**: Kit semver pinning; major bump'lar Renovate dashboard'unda manuel approval; minor + patch otomatik PR (CI yeşil + auto-merge dependency policy'sine tabi).
- **Lisans attribution**: `packages/ui/README.md` ve Brand Guideline Cover sayfasında atıf paragrafı.
- **`@glaon/ui` boundary**: Sadece bu paket Untitled UI primitive'lerini import edebilir; diğer paketler ve apps `@glaon/ui` üzerinden tüketir. CLAUDE.md "Package Boundaries" kuralı korunur.

## Sonuçlar

### Olumlu

- **Versioning native**: pnpm + Renovate kit upgrade'lerini ücretsiz handle eder; CI yeşil + auto-merge politikası uygulanabilir.
- **Tek ekosistem**: pnpm install hep bir akış, ek `git submodule update`, vendor folder veya manuel kopya yok.
- **CI auth basit**: GitHub Action otomatik `GITHUB_TOKEN` ile auth; ek secret yönetimi yok.
- **Source kontrol**: Tüm geliştiriciler ve CI tek registry'den aynı paket sürümüne erişir; lokal "vendor klasörünü unuttum" sınıfı sorun yok.
- **Lisans uyumlu**: Kit yalnızca org-internal package olarak yaşar, public registry'de değil.
- **Eski kararla uyumlu**: ADR 0001 (Turborepo + pnpm) ve ADR 0004 (`@glaon/core` boundary) ile çakışmaz; `@glaon/ui` tek consumer.

### Olumsuz / ödenecek bedel

- **Onboarding ekstra adım**: Yeni geliştirici GitHub PAT (read:packages scope) oluşturup `~/.npmrc`'ye eklemek zorunda. README runbook'u şart; otherwise `pnpm install` 401 ile patlıyor.
- **GitHub Packages quota**: Org'un private package storage + bandwidth quota'sına bağımlı. Glaon mevcut kullanım seviyesinde yeterli; takım büyürse takip edilmeli.
- **Auth troubleshooting**: PAT expiry, scope yanlışlığı veya `.npmrc` ordering sıkıntıları "neden install çalışmıyor" tipli destek isteği yaratabilir. Runbook bunu hafifletir.
- **Kit yayın akışı**: Kullanıcının kit'i her güncellemede `npm publish` etmesi gerekir; GitHub Action otomasyonu için ayrı bir release workflow kurulabilir (bu ADR kapsamı dışı).

### Etkileri

- **Kod organizasyonu**: `packages/ui/src/components/<Primitive>/` altında her primitive Untitled UI'nin headless karşılığını import eder; token'larla skin'lenir. Direct kit import sadece bu paketin içinde.
- **CI süresi**: pnpm cache'lenmiş `~/.pnpm-store` ile kit ek bir resolve zamanı eklemez; ilk install'da yalnızca download süresi devreye girer.
- **Göç**: Kitten vazgeçilirse yalnızca `@glaon/ui` içindeki wrap'lar değişir; consumer'lar (web, mobile, addon) etkilenmez. Lock-in component-API seviyesinde değil, paket seviyesinde.

## Tekrar değerlendirme tetikleyicileri

- Untitled UI'nin lisans modeli değişir (örn. open source'a geçer veya source vendor'ı kabul eder).
- GitHub Packages quota tutmuyor / fiyatlama değişir.
- Phase 1 sonunda kit kullanım yüzeyi çok ince kalırsa (sadece 2-3 primitive faydalanıyorsa) hand-roll daha düşük maliyet olabilir.
- Glaon repo'su private'a geçerse source vendor seçeneği yeniden açılır.

## Referanslar

- Issue #14 — `feat(ui): integrate Untitled UI React kit into @glaon/ui` (relabel: phase-3 → phase-1; bu ADR onun decision parçası).
- ADR 0001 — Turborepo + pnpm workspaces (paket yönetimi temeli).
- ADR 0010 — Figma tasarım kaynağı + plugin bridge (UUI'nin Figma tarafı tek dosya, source-of-truth).
- GitHub Packages npm docs: <https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-npm-registry>
- Untitled UI lisans bilgisi: lokal kayıtta (üye satın alma sayfası).
- `packages/ui/README.md` — per-developer ve CI kurulum runbook'u.
