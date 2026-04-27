# Chromatic

Chromatic, Glaon Storybook'unun görsel regresyon altyapısıdır. Her PR'da zorunlu check olarak çalışır; PR'larda **signal**, `development`/`main` push'larında **strict** policy uygular. Ayrıca remote MCP endpoint sağlar — AI agent'lar takımın Chromatic'teki component kataloguna uzaktan erişebilir.

## Nasıl çalışır?

1. `pnpm install` → `chromatic` CLI `packages/ui` devDependency'sinden gelir.
2. Her `push` (ve her PR) GitHub Action'ını tetikler ([.github/workflows/chromatic.yml](../.github/workflows/chromatic.yml)).
3. Action `chromaui/action@latest`'ı çağırır:
   - Storybook'u build eder (`packages/ui` altında).
   - Snapshot'ları Chromatic'e upload eder.
   - Baseline ile diff alır.
   - **PR event'inde** `exitZeroOnChanges: true` → check yeşil kalır, diff'ler Chromatic UI'da review için yayınlanır, PR merge engellenmez.
   - **Push event'inde (`development`, `main`)** `exitZeroOnChanges: false` → kabul edilmemiş diff varsa check **kırılır**, push reverse edilir veya Chromatic UI'da accept gerekir.
   - `development` branch'te `autoAcceptChanges: development` ile diff'ler otomatik baseline'a alınır; bu sayede strict gate yalnızca `development → main` release flow'unda gerçek anlamda bloklayıcı olur.
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
3. **Görsel değişiklik var (kasıtlı veya kasıtsız)** → check yeşil ✅ (PR'larda signal-only) ama Chromatic UI'da diff bekliyor. Reviewer Chromatic build'ini açar:
   - Kasıtlı değişiklik → "Accept" → diff baseline'a yazılır.
   - Kasıtsız regresyon → kodda düzelt, tekrar push.
   - PR mergeable kalır (CI block yok), ama unaccepted diff'ler `development`'a aktığında oradaki strict check kırılır → reviewer Chromatic link'ini ihmal etmemeli.

### `exitZeroOnChanges` neden conditional?

PR'larda strict tutum (`exitZeroOnChanges: false`) her ufak intentional değişiklikte reviewer'ı Chromatic UI'a göndermek + merge'i bloklamak demekti. Phase 1 boyunca bu pattern Glaon'un asıl iş hızını yavaşlattı (her primitive PR'ında manuel accept turu). Pull request'lerde signal-only (`exitZeroOnChanges: true`) reviewer'a Chromatic'i tarama özgürlüğü verir, `development`/`main` push'larında strict tutum kalan koruma katmanı olarak iş görür. Glaon CLAUDE.md'nin "Chromatic Visual Regression (MANDATORY)" kuralı bu split policy'yi açıkça yazar.

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

## Figma entegrasyonu

Chromatic, Figma'daki tasarımı Storybook'taki kod karşılığı ile aynı ekranda gösterir ve drift'i PR review anında yakalar. Bu bağlantı tasarımcı ile developer arasındaki "acaba bu güncel mi?" sorusunu ortadan kaldırır.

### Nasıl çalışır (mapping)

1. Chromatic, her build'de Storybook'un publish ettiği component kataloguna bakar.
2. Her component için Figma dosyalarında eşleşen ana component'i arar.
3. Eşleştirmeyi **otomatik** yapar: Figma component'inin `Description` alanındaki `storybook-id: <kebab-case>` satırı Storybook CSF title'ı ile karşılaştırılır (örn. `storybook-id: web-primitives-button` ⟷ Storybook `Web Primitives/Button`).
4. Manuel override Chromatic UI'dan mümkün ama default strateji otomatik — naming contract'ı [docs/figma.md](figma.md#component-description--storybook-id)'de sabit.

### PR experience

Chromatic build sonrası her PR'ın **Component snapshots** sayfasında her story için üç kolon:

| Kolon     | Ne gösterir                                                       |
| --------- | ----------------------------------------------------------------- |
| Figma     | Tasarımdaki son published varyant                                 |
| Storybook | Bu PR branch'indeki snapshot                                      |
| Diff      | `In sync` / `Design changed` / `Code changed` / `Not implemented` |

- **In sync** → iş tamam.
- **Design changed** → tasarımcı Figma'da güncelledi, kodda henüz yansımadı. Takip eden bir issue/PR lazım.
- **Code changed** → kod tasarımdan farklı yönde saptı. Tasarımcının onayı gerekir.
- **Not implemented** → Figma'da component var, Storybook'ta karşılığı yok. Storybook Rule'a göre zorunlu follow-up ([CLAUDE.md](../CLAUDE.md#storybook-rule-mandatory)).

### Design review iş akışı

Figma ve kod tarafının senkronu iki yönlü:

**Tasarımcı tarafından başlayan akış:**

1. Tasarımcı Figma Design System'de değişiklik yapar + publish eder.
2. Chromatic next build'te "Design changed" badge'ini basar.
3. Developer PR açarak kod tarafını günceller.
4. Chromatic build yeşil + "In sync" → merge.

**Developer tarafından başlayan akış:**

1. Developer kodda bir variant ekler + Storybook story'si yazar.
2. Chromatic build "Code changed" (Figma'da karşılığı yoksa) veya "Not implemented" (Figma'da hiç yoksa) basar.
3. Tasarımcıya Figma tarafında karşılığı çizmesi için issue açılır.
4. Her iki taraf hazır olunca Chromatic "In sync" → merge.

### Kurulum (one-time, kullanıcı aksiyonu)

1. [chromatic.com](https://www.chromatic.com) → Glaon projesi → **Manage** → **Integrations** → **Figma**.
2. Figma personal access token (read-only: File content + File metadata) yapıştır.
3. Figma dosya URL'lerini ekle — minimum: **Design System** (mapping source). Components ve Screens opsiyonel ama takım Chromatic'te Figma'da arama yapabilmek için eklemeleri faydalı.
4. İlk build'de Button (veya description'ında `storybook-id` olan ilk component) **Component snapshots** sayfasında "In sync" olarak görünmeli.

> Access token organization-level read-only; tasarım editliği için ayrı bir token'a gerek yok. Token Chromatic dashboard'ında Chromatic tarafından encrypted saklanır.

### Out of scope

- Figma Dev Mode kullanımı — opsiyonel, takım kararı.
- Figma yorumlarının PR'a sync'lenmesi — ayrı issue gerektirir.
- Token/Tailwind/UI Kit entegrasyonu — #48 sonrası değerlendirilecek.

## Sorun giderme

- **"Missing project token"** → `CHROMATIC_PROJECT_TOKEN` secret'ı ekli mi? Fork PR'larında secret erişilemez — fork katkıları için Chromatic check beklenmez.
- **Workflow çalışıyor ama Chromatic build hatası** → Action loglarında "Build Storybook" adımı başarılı mı? Lokal olarak `pnpm --filter @glaon/ui build-storybook` çalışıyor mu?
- **Baseline sapmış** → Chromatic UI → Settings → "Clear baseline" (sadece kasıtlı reset için).
- **MCP client bağlanmıyor** → Chromatic'te en az bir başarılı build olmalı; yoksa MCP endpoint boş. `curl <mcp-url>` ile JSON-RPC cevabı kontrol et.
- **`.mcp.json` HTTP 404 dönüyor** → URL'deki branch permalink'i kontrol et. Glaon'un default branch'i `development` — `main--` ile başlayan URL'ler 404 verir.
- **Chromatic'te Figma preview yok ama component description doğru** → Design System dosyası Chromatic'e bağlı mı? Dashboard → Manage → Integrations → Figma → dosya listesini kontrol et.
- **Figma preview "Not implemented" diyor ama Storybook'ta story var** → Figma component description'daki `storybook-id` formatı kebab-case mi? Boşluk, slash veya camelCase olursa parse edemez. Örn. `storybook-id: Web Primitives/Button` ❌ → `storybook-id: web-primitives-button` ✅.

## Referanslar

- Chromatic MCP: <https://www.chromatic.com/docs/mcp/>
- Chromatic Figma integration: <https://www.chromatic.com/docs/figma/>
- GitHub Actions: <https://www.chromatic.com/docs/github-actions/>
- TurboSnap (`onlyChanged`): <https://www.chromatic.com/docs/turbosnap/>
- İlgili issue'lar: #50, #53
