# @glaon/ui

Glaon'un primitive component kütüphanesi. Web (Vite/React 19) ve mobil (Expo/RN) consumer'ların tükettiği Storybook-tabanlı paket. Lisanslı **Untitled UI React kit**'in source code'unu CLI üzerinden çekip Glaon design token'larıyla yeniden temalar.

Kararın gerekçesi: [ADR 0011 — Untitled UI React kit + CLI source-based delivery](../../docs/adr/0011-untitled-ui-react-kit.md).

## Untitled UI React kit — kurulum

Kit lisanslı ve **npm paketi olarak yayınlanmaz**. Yayıncının resmi yolu `npx untitledui` CLI'sıdır; CLI component source'unu doğrudan projeye yazar (harici dep yok). Source dosyaları repo'ya commit edilir, böylece CI ek auth gerekmeden çalışır.

### Per-developer setup (yeni geliştirici onboarding)

1. **Pro lisans key edin**: <https://www.untitledui.com> → Pro hesap. Key dashboard'da görünür.
2. **CLI'a login**:
   ```bash
   npx untitledui login
   # alternatif: her komut için --license <key>
   ```
   Auth token CLI'ın local config'inde tutulur (`~/.config/untitledui/`); repo'ya commit edilmez.
3. **`pnpm install`** + Storybook çalıştır. Kit source'u zaten repoda → ek adım yok.
4. **Yeni primitive eklemek istiyorsan** ya da **kit upgrade** yapacaksan login state'i aktif kalmalı; aksi halde `untitledui add`/`upgrade` 401 verir.

### Yeni primitive ekleme (manuel adım)

`untitledui init` çalıştırılmaz — Glaon zaten Vite + Storybook ile kurulu. Sadece `add` kullanılır:

```bash
npx untitledui@latest add <component-name> \
  --type base \
  --path packages/ui/src/components/<Name> \
  --yes
```

Sonra Glaon wrap'ini yaz:

- `<Name>.tsx` (web) ve `<Name>.native.tsx` (RN, gerekiyorsa) kit primitive'ini import eder, Glaon design token'larıyla skin'ler.
- `<Name>.types.ts` shared prop sözleşmesi.
- `<Name>.stories.tsx` Storybook story'leri.
- `index.ts` re-export.

`packages/ui/src/index.ts` barrel'ı güncellemeyi unutma. CSF 3.0 + addon-a11y (error level) + `parameters.design` ile Figma frame embed zorunlu — bkz. [docs/storybook.md](../../docs/storybook.md), [docs/figma.md](../../docs/figma.md).

### Kit upgrade

Kit yeni sürümlerini takip etmek için yeni bir issue açıp ayrı bir branch'te:

```bash
npx untitledui upgrade
```

CLI etkilenen dosyaları yeniden yazar. Diff'i PR review'da incele — yayıncının breaking change'leri commit message'larında işaretlenir.

### CI tarafı

CI Storybook build, Chromatic, Vitest browser tests sırasında kit source'unu **mevcut olarak** kabul eder; `untitledui` CLI'sını çalıştırmaz, lisans key gerekmez. Workflow'larda ek auth setup yoktur.

## Lisans / attribution

`@glaon/ui`, Untitled UI React kit'inin Pro source code'unu Glaon proje deposuna gömerek kullanır. Yayıncının lisans şartlarının metni `LICENSE-untitledui.md` dosyasında repoda taşınır; her kit dosyasında CLI'ın eklediği header korunur.

> Bu paket, Untitled UI tarafından sağlanan licensed React component kit'inin source code'unu içerir. Source'un üretimi CLI yoluyla, sahip olunan Pro lisans key'i ile yapılır. Lisans şartlarının tam metni `LICENSE-untitledui.md` dosyasında, ek bilgi <https://www.untitledui.com> üzerindedir.

Brand Guideline Cover sayfasında da aynı paragraf release süresince güncel tutulur (bkz. #166).

## Untitled UI Remote MCP

Yayıncının resmi Remote MCP server'ı (`https://www.untitledui.com/react/api/mcp`) Claude Code session'larına component metadata + search exposure sunar — primitive ekleme öncesi spec'e bakmak, prop kombinasyonu doğrulamak, varyant inceleme. Repo-scoped `.mcp.json`'da `untitledui` server'ı tanımlı; header `Authorization: Bearer ${UNTITLED_TOKEN}` env interpolation kullanır.

### Per-developer setup

1. **`UNTITLED_TOKEN` env var'ını ayarla**:
   - Untitled UI Pro dashboard'undan API key edin.
   - Repo root'unda `cp .env.example .env` → `UNTITLED_TOKEN=...` doldur.
   - Shell rc'na ekle (`~/.zshrc` veya `~/.bashrc`) ve Claude Code'u o shell'den başlat:
     ```bash
     set -a; source /absolute/path/to/glaon/.env; set +a
     ```
   - `.env` gitignored, asla commit edilmez.
2. **Doğrulama**: `claude mcp list` → `untitledui: ... ✓ Connected`. Bağlantı kurulamıyorsa env var Claude Code'un başlatıldığı shell'de export edilmiş mi kontrol et (Claude Code MCP env interpolation #6204 bug'ından etkilenebilir; export edildiğinden emin ol, gerekirse shell'i yeniden başlat).

### CI tarafı

CI MCP server'a bağlanmaz — interactive auth flow CI'da çalışmaz, Storybook + Chromatic build yolu zaten yeterli. `UNTITLED_TOKEN`'ı CI secret olarak ekleme ihtiyacı yok.

### CLI vs MCP auth

CLI'nın `untitledui login` auth state'i ile bu MCP auth **ayrı kanaldır**. CLI stored config (`~/.config/untitledui/`) veya `--license` flag kullanır; MCP `${UNTITLED_TOKEN}` env interpolation üzerinden Bearer header. İkisi de aynı Pro hesap key'iyle besenebilir ama farklı yolda.

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

- **`untitledui add` 401 / 403**: `untitledui login` ile yeniden auth ol, ya da `--license <key>` flag'iyle çalıştır. Pro hesap aktif mi kontrol et.
- **Kit source'unda CLI değişiklik yapmadığım dosyaya da dokundu**: `--overwrite` olmadan default davranış; review et, gerekirse `git restore` ile geri al, `--path` argümanını daralt.
- **Storybook a11y panel'i `error` veriyor**: `addon-a11y` `a11y.test: 'error'` ile aktif; merge için yeşil olmalı. İstisnai durumlarda inline doc + scope-narrow `parameters.a11y.config.rules`.
- **Hex/px literal lint hatası**: Component dosyasında token yerine raw değer var. F2 üretimi `dist/tokens/{web.css,rn.ts}`'dan ilgili token'ı tüket.

## Referanslar

- [ADR 0011 — Untitled UI React kit + CLI source-based delivery](../../docs/adr/0011-untitled-ui-react-kit.md)
- [docs/storybook.md](../../docs/storybook.md) — story conventions + addons.
- [docs/figma.md](../../docs/figma.md) — tasarım kaynağı + plugin bridge.
- [docs/design-system-bootstrap.md](../../docs/design-system-bootstrap.md) — Figma file yapısı + primitive yetiştirme.
- [packages/ui/tokens/README.md](tokens/README.md) — design token export + schema.
- Untitled UI CLI: `npx untitledui --help`.
- Untitled UI MCP integration: <https://www.untitledui.com/react/integrations/mcp> — repo-scoped entry yukarıdaki "Untitled UI Remote MCP" bölümünde dokümante.
