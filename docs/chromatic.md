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

Glaon Storybook MCP'yi iki ayrı endpoint üzerinden yayınlar; hangi endpoint'in ne işe yaradığı önemli:

| Endpoint                                                              | Ne zaman                                 | Toolset'ler    |
| --------------------------------------------------------------------- | ---------------------------------------- | -------------- |
| **Lokal** `http://localhost:6006/mcp`                                 | `pnpm --filter @glaon/ui storybook` açık | `dev` + `docs` |
| **Remote Chromatic** `https://development--<appId>.chromatic.com/mcp` | Her zaman (publish edilen build)         | sadece `docs`  |

Pratikte: story kodunu, argları veya aktif state'i gören tool'lar (`preview-stories`) için lokal dev server gerekiyor. Published katalog sorguları (`list-all-documentation`, `get-documentation-for-story`) için Chromatic remote yeterli — repo clone'a ihtiyaç yok.

### Repo-scoped kurulum (Claude Code, takımın tümü)

Chromatic remote MCP server'ı repo kökündeki [`.mcp.json`](../.mcp.json) üzerinden tanımlı. Claude Code repo'yu açtığında dosyayı okur ve ilk çalıştırmada "bu MCP server'a izin verilsin mi?" diye sorar — kabul et, ayrı adım yok.

`.mcp.json` içeriği (referans):

```json
{
  "mcpServers": {
    "chromatic": {
      "type": "http",
      "url": "https://development--69e71a019e496564c84d2a4b.chromatic.com/mcp",
      "headers": { "X-Client-Id": "cdf3737dff9d485485968e50b63fd8b4" }
    }
  }
}
```

URL anatomisi: `https://<branch>--<appId>.chromatic.com/mcp`. Branch permalink olarak `development` (Glaon'un default branch'i) kullanılır — böylece MCP client her zaman en son accepted baseline'ı görür. `appId` (`69e71a019e496564c84d2a4b`) Chromatic dashboard → Manage sayfasından doğrulanabilir.

Client ID (`cdf3737dff9d485485968e50b63fd8b4`) Chromatic'in Claude Code/Cursor gibi CIMD-dışı client'lar için resmi static ID'sidir — secret değildir, public. VSCode + GitHub Copilot kullananlar bunun yerine CIMD flow'unu kullanır (ayrı issue).

### Doğrulama

1. Claude Code'u repo'da aç. MCP prompt'unda izin ver.
2. `claude mcp list` → `chromatic` server'ı **connected** olarak görünmeli.
3. Test: agent'a "Chromatic MCP'deki `list-all-documentation` aracını çalıştır ve ilk 3 component'i listele" de. Glaon Storybook içeriği dönmeli.
4. Alternatif (shell):
   ```bash
   curl -sS -X POST https://development--69e71a019e496564c84d2a4b.chromatic.com/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -H "X-Client-Id: cdf3737dff9d485485968e50b63fd8b4" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   ```
   JSON-RPC response'ta `list-all-documentation` ve `get-documentation-for-story` tool'ları görülmeli.

### Per-user alternatifi (opsiyonel)

Repo-scoped `.mcp.json`'ı kullanmak istemeyen developer'lar aynı config'i `claude mcp add` ile user-scope olarak ekleyebilir. Ama default yol repo-scoped — takımın tümü otomatik aynı endpoint'e bağlansın diye.

### Lokal-only tools (remote'ta yok)

- `preview-stories` → sadece dev server.
- `run-story-tests` → Vitest browser + addon-vitest gerekli; ayrı issue.

## Sorun giderme

- **"Missing project token"** → `CHROMATIC_PROJECT_TOKEN` secret'ı ekli mi? Fork PR'larında secret erişilemez — fork katkıları için Chromatic check beklenmez.
- **Workflow çalışıyor ama Chromatic build hatası** → Action loglarında "Build Storybook" adımı başarılı mı? Lokal olarak `pnpm --filter @glaon/ui build-storybook` çalışıyor mu?
- **Baseline sapmış** → Chromatic UI → Settings → "Clear baseline" (sadece kasıtlı reset için).
- **MCP client bağlanmıyor** → Chromatic'te en az bir başarılı build olmalı; yoksa MCP endpoint boş. `curl <mcp-url>` ile JSON-RPC cevabı kontrol et.
- **`.mcp.json` HTTP 404 dönüyor** → URL'deki branch permalink'i kontrol et. Glaon'un default branch'i `development` — `main--` ile başlayan URL'ler 404 verir.

## Referanslar

- Chromatic MCP: <https://www.chromatic.com/docs/mcp/>
- GitHub Actions: <https://www.chromatic.com/docs/github-actions/>
- TurboSnap (`onlyChanged`): <https://www.chromatic.com/docs/turbosnap/>
- İlgili issue: #50
