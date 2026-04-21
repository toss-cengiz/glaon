# Chromatic

Chromatic, Glaon Storybook'unun görsel regresyon altyapısıdır. Her PR'da zorunlu check olarak çalışır, beklenmeyen piksel farkı olduğunda merge'i engeller. Ayrıca remote MCP endpoint sağlar — AI agent'lar takımın Chromatic'teki component kataloguna uzaktan erişebilir.

## Nasıl çalışır?

1. `pnpm install` → `chromatic` CLI `packages/ui` devDependency'sinden gelir.
2. Her `push` (ve her PR) GitHub Action'ını tetikler ([.github/workflows/chromatic.yml](../.github/workflows/chromatic.yml)).
3. Action `chromaui/action@latest`'ı çağırır:
   - Storybook'u build eder (`packages/ui` altında).
   - Snapshot'ları Chromatic'e upload eder.
   - Baseline ile diff alır.
   - Piksel farkı varsa check **kırılır** (`exitZeroOnChanges: false`) → PR merge edilemez.
   - `development` branch'te (baseline branch) otomatik accept: `autoAcceptChanges: development`.
4. Development server çalışırken Chromatic MCP endpoint'i `http://localhost:6006/mcp` (lokal, dev + docs tools). Uzak Chromatic MCP ise Chromatic cloud'da host edilir; agent bağlandığında sadece docs tools'a erişir.

## İlk kurulum (kullanıcı aksiyonları)

### 1. Chromatic hesabı ve proje

- [chromatic.com](https://www.chromatic.com) → GitHub ile giriş.
- "Add project" → `toss-cengiz/glaon` seç.
- Otomatik olarak `CHROMATIC_PROJECT_TOKEN` üretilir.

### 2. GitHub repository secret

- Repo → Settings → Secrets and variables → Actions → **New repository secret**.
- Name: `CHROMATIC_PROJECT_TOKEN`
- Value: Chromatic projesinden kopyaladığın token.

### 3. Branch protection (zorunlu check)

- Repo → Settings → Branches → **Add branch protection rule**.
- Pattern: `development`
  - ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date
  - Status check: `Chromatic / visual regression` (workflow ilk başarılı çalıştıktan sonra listede belirir)
- Aynı kuralı `main` için de uygula.

### 4. İlk baseline

- `development` branch'e ilk push (örn. bu PR'ın merge'i):
  - Workflow çalışır → Storybook build → Chromatic'e publish → baseline oluşur.
  - Bundan sonra her push/PR baseline ile karşılaştırılır.

## Günlük akış

### Story değiştiğinde

1. PR açılır. Chromatic workflow çalışır.
2. **Hiç görsel değişiklik yok** → check yeşil ✅, merge serbest.
3. **Kasıtsız görsel değişiklik** (regresyon) → check kırmızı ❌. Kodda düzelt, tekrar push.
4. **Kasıtlı görsel değişiklik** → check kırmızı. Chromatic UI'da build'i aç → "Review changes" → piksel diff'lerine bak → "Accept" → check yeşile döner. Merge serbest.

### Neden `exitZeroOnChanges: false`?

Default opsiyonu seçersek (change'ler exit 0 ile geçer), reviewer'lar görsel değişikliği kaçırabilir. Mandatory check olarak tutmak = her görsel değişikliğin insan gözünden geçmesini garantiler. Glaon CLAUDE.md'nin "Chromatic Visual Regression (MANDATORY)" kuralı bu kararı somutlaştırır.

### `onlyChanged: true` (TurboSnap)

Chromatic, sadece değişen story'lerin snapshot'ını alır (dependency grafını tarayarak). İlk build tam, sonrakiler incremental. Ücretsiz plan snapshot kotasını bu yüzden hızlı tüketmez.

### Skip edilen branch'ler

`dependabot/**` ve `release-please--**` branch'leri workflow dışındadır. Bu branch'ler otomatik bot PR'ları üretiyor ve görsel etki yapmadıkları varsayılıyor. Eğer bir dependabot PR'ı UI paketi güncelliyorsa manuel olarak `chromatic` komutunu çalıştır.

## Lokal kullanım

```bash
# Token'ı environment'tan oku
export CHROMATIC_PROJECT_TOKEN=<token>
pnpm --filter @glaon/ui chromatic
```

- Lokal'den çalıştırınca build Chromatic'e upload edilir; sadece local branch için.
- Production baseline'ları etkilemez.
- Hızlı diff almak için kullanışlı.

## MCP entegrasyonu

`@storybook/addon-mcp` iki modda çalışır:

- **Lokal** (Storybook dev server): `http://localhost:6006/mcp`, `dev` + `docs` toolsets aktif.
- **Remote** (Chromatic cloud): Chromatic, publish edilen Storybook'u kendi MCP endpoint'i üzerinden yayınlar. Sadece `docs` tools remote.

### MCP client bağlama (Claude Code örneği)

İlk başarılı Chromatic publish'ten sonra:

```bash
npx mcp-add --type http
```

Komut interaktif olarak Chromatic MCP URL'ini ve client ID'yi sorar. Claude Code için static client ID: `cdf3737dff9d485485968e50b63fd8b4`.

Doğrulama prompt'u: agent'a `list-all-documentation` aracını çalıştırmasını söyle. Glaon Storybook'taki dokümantasyon + autodocs içerikleri dönmeli.

### Lokal-only tools (remote'ta yok)

- `preview-stories` → sadece dev server.
- `run-story-tests` → Vitest browser + addon-vitest gerekli; bu PR'ın dışında.

## Sorun giderme

- **"Missing project token"** → `CHROMATIC_PROJECT_TOKEN` secret'ı ekli mi? Fork PR'larında secret erişilemez — fork katkıları için Chromatic check beklenmez.
- **Workflow çalışıyor ama Chromatic build hatası** → Action loglarında "Build Storybook" adımı başarılı mı? Lokal olarak `pnpm --filter @glaon/ui build-storybook` çalışıyor mu?
- **Baseline sapmış** → Chromatic UI → Settings → "Clear baseline" (sadece kasıtlı reset için).
- **MCP client bağlanmıyor** → Chromatic'te en az bir başarılı build olmalı; yoksa MCP endpoint boş. `curl <mcp-url>` ile JSON-RPC cevabı kontrol et.

## Referanslar

- Chromatic MCP: <https://www.chromatic.com/docs/mcp/>
- GitHub Actions: <https://www.chromatic.com/docs/github-actions/>
- TurboSnap (`onlyChanged`): <https://www.chromatic.com/docs/turbosnap/>
- İlgili issue: #50
