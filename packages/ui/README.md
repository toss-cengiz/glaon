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

Yayıncının resmi Remote MCP server'ı (`https://www.untitledui.com/react/api/mcp`) Claude Code session'larına component metadata + search exposure sunar — primitive ekleme öncesi spec'e bakmak, prop kombinasyonu doğrulamak, varyant inceleme. Repo-scoped `.mcp.json`'da `untitledui` server'ı tanımlı; auth tarafı per-developer.

Yeni geliştirici:

1. Claude Code session'ında `/mcp` slash command → server listesinde `untitledui` görünür, status **needs authentication**.
2. `untitledui` üzerinde **Authenticate** seçeneğini tetikle → tarayıcıda Untitled UI OAuth ekranı açılır.
3. Onaylanan scope: free + Pro component metadata + search read access. **Write scope istenmez.**
4. Onay sonrası `claude mcp list` → `untitledui` status **connected**.

CLI'nın `untitledui login` auth state'i ile bu MCP auth ayrı kanaldır; MCP browser flow OAuth, CLI ya `--license` flag ya stored config kullanır. CI'da MCP bağlanmaz (interactive flow) — Storybook + Chromatic CI yolundan ilerler.

## Theme tüketimi

`@glaon/ui` light/dark için `ThemeProvider` + `useTheme()` API'sini export eder. Tasarım token'ları F2 (Style Dictionary) tarafından `dist/tokens/{web.css,rn.ts}`'ye üretilir ve consumer'lar provider'a explicit olarak geçer:

```tsx
import { tokens } from '@glaon/ui/dist/tokens/rn';
import { ThemeProvider, useTheme } from '@glaon/ui';

function App() {
  return (
    <ThemeProvider tokens={tokens}>
      <Root />
    </ThemeProvider>
  );
}

function Root() {
  const { name, tokens } = useTheme<typeof import('@glaon/ui/dist/tokens/rn').tokens>();
  // name: 'light' | 'dark'; tokens: typed nested object
  return null;
}
```

Web tarafı `dist/tokens/web.css`'yi consumer'ın root CSS entry'sinden değil **`packages/ui/src/styles/globals.css`'in kendisinden** import eder. Bu sayede `@glaon/ui/styles` export'unu import eden her app (apps/web, Storybook, gelecekteki app'ler) Glaon F2 brand scale'ini otomatik alır — `glaon-overrides.css` UUI `--color-brand-*` semantik ailesini bu F2 `--brand-*` token'larına map'liyor; F2 olmadan kit Button / Logo aksent / Tabs brand state'leri boş render olur (regression hikayesi: #498 → #501 → #502).

Generated `dist/tokens/web.css` dosyası repo'ya commit edilmez (`.gitignore`). Turbo `^build:tokens` dependency'si `dev` ve `build` task'larında tanımlı; `pnpm --filter @glaon/web {dev,build}` çağrıldığında Style Dictionary çıktısı otomatik üretilir. Storybook script'i (`pnpm build:tokens && storybook dev`) Turbo'dan bağımsız çalıştığı için kendi pre-step'ini koruyor.

RN tarafı yalnızca `useTheme()` üzerinden tokens'ı tüketir.

**Şu anda dark mode görsel fark etmez**: kaynak Variables collection'ı + Theme: Dark mode'ları Figma'da henüz yok (#140 takibi). API forward-compatible — Variables eklendiğinde F2 `[data-theme='dark']` CSS override + dark RN tokens emit edecek, mevcut consumer kodu değişmeden ve dark görünümler otomatik aktif olacak.

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
