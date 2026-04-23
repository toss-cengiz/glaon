# Figma — Tasarım Tek Kaynağı

Glaon için tasarım Figma'da yaşar. Renkler, spacing, typography, shadow, component görselleri, ekran mockup'ları hepsi Figma'dadır. Kod bu kaynağa **referans yazar**, alternatif değildir.

Bu sayfa:

- Figma dosya yapısını tanımlar.
- Design token export stratejisini sabitler.
- Figma Remote MCP bind adımlarını anlatır.
- Figma ⇄ Storybook naming eşlemesini koyar.
- Design → kod review akışını anlatır.

## Dosya yapısı

Dört ayrı Figma dosyası (aynı takım / workspace altında):

| Dosya               | İçerik                                                                                                       | Faz      | URL                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------- |
| **Brand Guideline** | Color rationale, typography, spacing/radii/shadow, logo usage, do/don't — brand kararlarının kanonik kaynağı | phase-1  | <https://www.figma.com/design/JLbLmCMDdhxOisbVYiAo5C/Glaon>         |
| **Design System**   | Primitive'ler, color palette, type scale, spacing, radii, shadow — published library                         | phase-3+ | <https://www.figma.com/design/KP0SVNxQEjT0gotajwc9I0/Design-System> |
| **Components**      | Design System'i tüketen composite component'ler (Card, Dialog, DeviceTile…)                                  | phase-3+ | <https://www.figma.com/design/auyB12SfWNs3eUho4UpI2k/Components>    |
| **Screens**         | Web + mobile ekran mockup'ları (dashboard, detail, settings…)                                                | phase-3+ | <https://www.figma.com/design/JdUxahXzXwVAsjkgzIjIT9/Screens>       |

Tüm takım üyeleri dördüne de en az "can view" seviyesinde erişime sahip olur.

### Faz eşlemesi

Brand Guideline **phase-1**'de aktif olarak kullanılır; Glaon'un brand kararlarının (renk rationale'ı, tipografi, spacing/radii/shadow, logo kullanımı, do/don't) kanonik kaynağıdır. Design System library bu kararları token primitive'leri olarak **phase-3 ve sonrasında** yayınlar; Components ve Screens aynı fazlarda onu tüketir. Yani brand decisions önce Brand Guideline'da karara bağlanır, sonra Design System library'ye düşer — tek yönlü bir akış.

### Neden dört dosya?

- **Rationale vs published library**: Brand Guideline brand kararlarının ve do/don't'ların yaşadığı dosya; Design System bu kararları tüketen published token + primitive library. Rationale curated ve seyrek değişir; library versiyonlanır ve token değişiklikleri consumer dosyalara yayılır. Tek dosyada "rationale'ı neden değiştirmiyoruz?" ile "library'yi neden bump'lıyoruz?" aynı branch'te karışır.
- **Library vs consumer ayrımı**: Design System published library olduğunda, Components ve Screens dosyaları onu tüketir (version pinning, instance override trace'i). Tek dosyada karışık olsa branch publish karmaşık hale gelir.
- **Scope-based review**: Token değişikliği Design System PR'ında, yeni composite Components dosyasında, ekran mockup'ı Screens dosyasında tartışılır.
- **Chromatic-Figma uyumu** (#53): Chromatic Figma plugin'i bir Storybook component'ini bir Figma component'ine map ederken, Design System dosyasındaki kanonik olanı işaret eder.

## Design token akışı

### Karar: **Seçenek A** — Figma Tokens plugin → Style Dictionary

Tokens `@glaon/core` (veya `@glaon/design-tokens` — ayrı paket kararı token generator issue'sunda) içinde JSON olarak commit'lenir. Figma'dan export, Style Dictionary üzerinden web/mobile dağılım.

```
Figma Variables  →  [Figma Tokens plugin]  →  tokens/*.json  →  [Style Dictionary]  →  {web/*.css, rn/*.ts}
     (kanonik)          export                  (repo)            transform              (tüketici)
```

Neden A (B ve C'ye karşı):

- **Deterministik build**: Tokens commit'lenir → PR diff'i görülür → "renk mi değişti?" sorusu tek kelimelik review'la cevaplanır.
- **Offline build**: CI + local build Figma'ya bağlı değil; network outage prod'u etkilemez.
- **Chromatic-Figma hazır**: Token + component kombinasyonu bire bir izlenebilir (#53).
- **Rollback kolay**: Yanlış bir token revert = git revert.

Seçilmeyenler:

- **B** (lokal REST script): Aynı JSON'u üretir ama "kim ne zaman koştu" belirsiz. İlerde A'ya CI eklenirse B otomatik devre dışı kalır; şimdi seçmenin kazancı yok.
- **C** (runtime MCP read): Tasarım verisi kod base'ine işlenmez → PR diff'lenemez, build-time deterministik değil, offline çalışmaz. Keşif/prototip için OK ama prod için değil.

### Token generator implementasyonu (bu issue'da yok)

Figma Tokens plugin'in hangi versiyonu, tokens.json şeması, Style Dictionary config'i, CI'a bağlanması — hepsi **ayrı issue**. Bu baseline issue sadece kararı sabitler; kod üretimi design system dosyası oluşup ilk token set'i çıkınca başlar.

### Token kategorileri (plugin config'i için)

Figma Variables'da en az iki mode tanımlanır:

- **Theme**: `light` / `dark`
- **Platform**: `web` / `mobile` (spacing scale RN'de 4px multiplier farkı var; typography stack'leri farklı)

Token isimlendirmesi: `color.brand.primary`, `space.4`, `radius.md`, `shadow.card`, `type.body.medium.size`. Dot-notation Style Dictionary default'u ile uyumlu.

## Figma Remote MCP

Claude Code ve diğer agent'lar Figma Remote MCP üzerinden tasarım dosyalarını okur (component listesi, frame'ler, variable'lar). Lokal Figma desktop app'inin MCP server'ı (dev-mode) ayrı bir kanaldır; Glaon için remote MCP kullanılır çünkü takımın tümü aynı endpoint'e bağlanır.

### Kurulum

1. Figma hesabı ile giriş yap → Team'de **Dev mode** ve MCP enabled.
2. Claude Code → Figma MCP authenticate tool'u tetikle; browser OAuth flow'u açılır.
3. Onaylanan scope: file read (component, variable, frame metadata). **Write scope istenmez.**
4. Repo kökündeki [`.mcp.json`](../.mcp.json)'a Figma entry'si eklenir (_yazma sırası: OAuth başarıyla döndükten sonra, ayrı commit_). Beklenen şekil:

   ```jsonc
   {
     "mcpServers": {
       "chromatic": { "...mevcut...": true },
       "figma": {
         "type": "http",
         "url": "https://<figma-remote-endpoint>",
         "headers": { "...auth metadata...": "" },
       },
     },
   }
   ```

   > Gerçek URL ve auth header'lar Figma tarafından OAuth callback'inde sağlanır; şu an placeholder. `.mcp.json` güncellemesi OAuth başarıyla tamamlanana kadar ertelenir.

5. `claude mcp list` → `figma` status **connected**.

### Kullanım sınırları

- Read-only. Agent Figma'da değişiklik yapmaz; tasarım değişiklikleri insan aksiyonudur.
- Büyük dosyalarda frame sayısı MCP response boyutunu şişirir; spesifik component/page sorgula.

## Naming convention (Figma ⇄ kod)

Design System Figma dosyasındaki component hiyerarşisi bire bir Storybook `title` alanına eşlenir:

| Figma path                              | Storybook title                                   |
| --------------------------------------- | ------------------------------------------------- |
| `Web Primitives/Button/Primary`         | `Web Primitives/Button` → story `Primary`         |
| `Web Primitives/Button/Disabled`        | `Web Primitives/Button` → story `Disabled`        |
| `RN Primitives/PressableButton/Primary` | `RN Primitives/PressableButton` → story `Primary` |

Storybook tarafındaki konvansiyon [docs/storybook.md](storybook.md)'de tanımlı.

### Component description → Storybook ID

Her Figma component'inin description alanında Storybook component ID'si yazılır:

```
storybook-id: web-primitives-button
```

Chromatic Figma plugin (#53) bu etiketi okuyup pixel diff map'ini kurar. Storybook ID formatı: CSF path'inin kebab-case'i (`Web Primitives/Button` → `web-primitives-button`).

## Chromatic ile design-code diff

Figma'daki tasarım ile Storybook'taki kod karşılığı Chromatic üzerinden yan yana görünür. Bu bağlantı tasarım ↔ kod drift'ini PR review anında yakalar — tasarımcı Figma'da renk değiştirdiğinde Chromatic build'i component snapshot'ında "Design changed" badge'i basar, developer kod tarafında takip edip etmediğini tek ekranda görür.

Detaylar [docs/chromatic.md](chromatic.md#figma-entegrasyonu)'daki "Figma entegrasyonu" bölümünde. Mapping mekaniği buradaki [naming convention](#naming-convention-figma--kod) bölümüne dayanır.

### Kısa özet (developer tarafı)

- PR açtığında Chromatic build'inin **Component snapshots** sayfasına gir → her story için Figma preview + Storybook preview + diff badge görünür.
- Badge "In sync" ise iş tamam. "Design changed" ise tasarımcıdan gelen değişikliği kod tarafında takip et. "Code changed" (design'a göre) ise tasarımcı onay verene kadar bekle.
- Storybook'ta olmayan Figma component'leri "Not implemented" olarak işaretlenir — bu bir signal, Storybook Rule'a göre zorunlu follow-up.

## Design review akışı

1. **Figma'da öneri**: Tasarımcı ilgili dosyada branch açar (Figma branching) veya comment'lerle değişikliği iletir.
2. **Tartışma**: Figma comment thread'i.
3. **Merge (Figma tarafı)**: Onay sonrası branch main'e merge olur. Design System'de token değişikliyse published library bump'lanır.
4. **Kod PR'ı**: Token değişikliyse ayrı bir issue + PR açılır, token regenerate edilir, commit'lenir. Component görsel değişikliyse Chromatic'te diff oluşur → #53 üzerinden otomatik mapping.

### Tasarım ↔ kod senkron kuralı

- Figma'da değişen bir component'in kodda karşılığı yoksa, kod PR'ı **zorunlu follow-up** (issue + PR). Design System'de orphan component bırakılmaz.
- Kodda yeni bir primitive eklenmek isteniyorsa **önce Figma'da** tasarlanır; Figma olmadan eklenen component'in review'ı blocked.

## Claude-authored design

Figma Remote MCP (#52) read-only. "Yeni variant üret", "brand rengini tüm primitive'lerde güncelle", "verbal brief'ten token üret" gibi write-tarafı görevler için Claude'a ayrı bir kanal açılır — ama otomatik yazma yoktur. Akış: Claude plugin script'i yazar, kullanıcı Figma'da manuel çalıştırır, review eder, publish eder.

### Parçalar

1. **`brand-design` skill** — [`.claude/skills/brand-design/SKILL.md`](../.claude/skills/brand-design/SKILL.md). Glaon'un brand girdilerini (palette, typography, spacing, component personality, do/don't) ve Claude'un design sorularında uyacağı guardrail'leri tutar. Brand-seviyesi sorular ("warning rengi nasıl olsun?", "bu card hangi token'ı kullanmalı?") bu skill üzerinden çalışır.
2. **Figma Plugin bridge** — [`tools/figma-plugin/`](../tools/figma-plugin/). Claude mutasyon gerektiren bir iş için plugin script'i üretir; kullanıcı Figma desktop'ta **Plugins → Development → Import plugin from manifest…** ile yükleyip çalıştırır. Plugin repo'da commit'li kalır, ama `code.js`'in task'a özel içeriği commit edilmez (scaffold hali korunur, task sonrası `git restore`).
3. **REST write scope — Phase 0'da yok.** `file:write` token güçlü ama kazara mutasyon riski taşır; plugin akışı yetersiz olduğu iddia edilene kadar kapalı.

### Neden plugin, neden REST değil?

- Auth Figma desktop session'ında zaten var — ayrı token yönetimi, secret rotation yok.
- Mutasyon **insan-tetikli**. Claude `run` edemez → CI'dan kazara design mutasyonu mümkün değil.
- Figma undo/history plugin mutasyonlarını kapsar; rollback ucuz.
- Publish (library bump) ayrı ve manuel bir adım — yayınlanmamış bir mutasyon tüketicileri etkilemez.

### Script guardrails

Claude-authored her Figma plugin script'i şu kalıba uyar:

- **Dry-run default.** Mutasyon yapmadan önce script başında `CONFIRM = false` → neyi değiştireceğini `figma.notify` ile özetle. Kullanıcı `CONFIRM = true` yapıp tekrar çalıştırana kadar yazmaz.
- **Scope dar.** Task'ın istediği node/variable/component dışına çıkmaz.
- **Network yok.** `manifest.json` `networkAccess.allowedDomains: ["none"]`. Harici veriye ihtiyaç varsa script start'ta durur, kullanıcıdan ister.
- **Her zaman `figma.closePlugin()`.** Error path dahil. Ve `figma.notify` ile sonuç özeti bas.

### Handoff back to code

Plugin mutasyonu Figma'da biter; değişikliğin kod tarafına yansıması için ayrı adımlar:

- **Token değişti** → token generator (ayrı issue) JSON'u yeniden üretir; generator yokken kullanıcı Figma Tokens plugin'iyle manuel export eder.
- **Component değişti** → Chromatic design-code diff bir sonraki build'de drift'i işaretler (bkz. [docs/chromatic.md](chromatic.md)), follow-up kod PR'ı açılır.
- **Yeni primitive çizildi** → Storybook Rule devreye girer: primitive'in story'si aynı kod PR'ında yazılır (bkz. [docs/storybook.md](storybook.md)).

Skill ve plugin loop'u _kendisi_ kapatmaz — önerir ve devretir.

## Follow-up işler (bu issue kapsamı dışı)

| Konu                                             | Durum                                                           |
| ------------------------------------------------ | --------------------------------------------------------------- |
| Figma Tokens plugin + Style Dictionary generator | ayrı issue açılacak (dosyalar + ilk token set'i olduktan sonra) |
| Figma MCP `.mcp.json` entry                      | OAuth başarılı olunca küçük PR                                  |
| Chromatic ⇄ Figma design-code diff               | #53                                                             |
| Figma branching + design review Slack bot        | ayrı issue                                                      |
| REST `file:write` scope değerlendirmesi          | plugin akışı yetersiz kalırsa ayrı issue                        |

## Sorun giderme

- **MCP OAuth loop** → Figma takım ayarında "Third-party integrations" kapatılmış olabilir; takım admin'i açar.
- **`claude mcp list` → figma connected yok** → `.mcp.json` entry'si henüz commit'lenmedi; bu dosyanın MCP bölümü OAuth bitince güncellenir.
- **Storybook ID'leri eşleşmiyor** → Figma component description formatı `storybook-id: <kebab-case>` olmalı; boşluk veya noktalı virgül olursa plugin parse edemez.
- **Token değişikliği kodda yansımıyor** → Generator script'i henüz yok; şimdilik manuel export → JSON commit; generator ayrı issue ile.

## Referanslar

- Figma Variables: <https://help.figma.com/hc/en-us/articles/15145852043927>
- Figma Tokens plugin: <https://docs.tokens.studio/>
- Style Dictionary: <https://amzn.github.io/style-dictionary/>
- Figma MCP (remote): <https://www.figma.com/developers/mcp>
- İlgili issue'lar: #52 (bu sayfa), #53 (Chromatic-Figma), #47 (Storybook RN), #48 (Untitled UI wrap)
