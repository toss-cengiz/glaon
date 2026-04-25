# Glaon Figma Plugin — Scaffold

Bu dizin, Claude-authored design değişikliklerinin Figma'ya taşınması için kullanılan yerel Figma Plugin iskeletidir. Plugin **hiçbir yerde publish edilmez**; sadece geliştirici makinesinde "Development" plugin olarak yüklenir ve manuel çalıştırılır.

Detaylı workflow ve kurallar: [docs/figma.md](../../docs/figma.md#claude-authored-design).

## Dosyalar

- `manifest.json` — Figma Plugin manifest (API 1.0). `editorType` hem `"figma"` hem `"dev"` içerir, yani plugin Design Mode ve Dev Mode'da import edilebilir. Network access kapalı; dynamic-page access açık (büyük dosyalarda page-by-page yükler).
- `code.js` — plugin entry. Scaffold hali sadece notification gösterip kapanır. Her task için bu dosyanın içeriği yeniden yazılır; ad-hoc task'larda commit etmeyiz, lokal kullanılır ve `git restore` ile scaffold'a dönülür.
- `scripts/` — yeniden kullanılabilir, commit'li script kütüphanesi. Bootstrap operasyonları (Variables yaratma, text styles ekleme, primitive re-skin) bu dizinde yaşar; per-task çalıştırmak için içeriği `code.js`'e kopyalanır.
- `brand-design` skill (`.claude/skills/brand-design/SKILL.md`) — plugin script'i üretirken Claude'un uymak zorunda olduğu guardrail'leri tanımlar (dry-run default, `CONFIRM` flag, no network, notify+closePlugin).

## Figma'ya nasıl yüklenir?

1. Figma desktop app'i aç (browser'da plugin development desteklenmiyor).
2. Menu: **Plugins → Development → Import plugin from manifest…**
3. `tools/figma-plugin/manifest.json` dosyasını seç.
4. Plugin listede "Glaon" olarak görünür.
5. Çalıştırmak için: açık olduğun dosyada **Plugins → Development → Glaon**.

İlk import sonrası değişiklikleri görmek için plugin'i yeniden açman yeterli — Figma her açılışta `code.js`'i diskten okur. Manifest değiştiğinde Figma uyarır ve tekrar import istenebilir.

## Task akışı (Claude-authored script)

İki kanal var: `scripts/` altındaki yeniden kullanılabilir script'ler ve ad-hoc per-task script'ler. İkisi de aynı `code.js` entry'si üzerinden çalışır.

### Scripts/ ile çalışmak (yeniden kullanılabilir)

`scripts/` dizininde commit edilmiş bootstrap operasyonları için:

1. İlgili dosyayı seç (örn. `scripts/01-variables-bootstrap.js`).
2. Tüm içeriğini `tools/figma-plugin/code.js`'in üzerine kopyala.
3. Figma desktop'ta hedef dosyayı aç → Plugins → Development → Glaon → çalıştır.
4. Default `CONFIRM = false` → dry-run özeti `figma.notify` ile görünür, mutasyon yok.
5. Özeti onayladıysan script'in başındaki `CONFIRM = true` flag'ini elle aç → tekrar çalıştır.
6. Figma'da değişiklikleri review et → memnunsan library'yi publish et; değilse `Ctrl+Z`.
7. `code.js`'i scaffold haline döndür: `git restore tools/figma-plugin/code.js`.

`scripts/` dosyaları idempotent yazılır — yeniden çalıştırmak güvenlidir; var olan node'ları yeniden yaratmaz, eksikleri ekler.

### Ad-hoc per-task script

Yeniden kullanım planı olmayan tek-seferlik operasyonlar için:

1. İhtiyaç doğar: "bu variable'ları yeniden adlandır", "bu rengi şu node'a ata", vb.
2. Claude görevi `brand-design` skill'i üzerinden analiz eder ve `code.js`'e uygun script'i yazar.
3. Script default **dry-run**, `CONFIRM = true` ile mutasyona geçer.
4. Figma'da review + publish veya undo.
5. `code.js`'i scaffold haline döndür (`git restore tools/figma-plugin/code.js`) — ad-hoc script'ler repo'ya commit edilmez. Yeniden kullanılabilir olduğu ortaya çıkarsa ayrı issue açılıp `scripts/` altına taşınır.

## Neden plugin, neden REST değil?

Figma REST API `file:write` scope'u güçlü ama kazara/otomatik mutasyon riski taşır. Plugin workflow'u:

- Auth Figma desktop session'ında; ayrı token yönetimi yok.
- Mutasyon insan tetikli; Claude "run" edemez.
- Figma history/undo plugin mutasyonlarını da kapsar → rollback ucuz.

REST write scope'u Phase 0 kapsamında değil. Plugin akışı yetersiz kaldığı iddia edilirse ayrı issue'da değerlendirilir (bkz. [docs/figma.md](../../docs/figma.md#follow-up-işler-bu-issue-kapsamı-dışı) follow-up tablosu).

## Guardrail hatırlatmaları

- **Dry-run default, `CONFIRM = true` ile aç.** Claude-authored her script bu kalıba uyar.
- **Network yok.** `manifest.json` `networkAccess.allowedDomains: ["none"]`. Harici veri gerekiyorsa script başında stop et ve kullanıcıdan iste.
- **Her zaman `figma.closePlugin()`** — error path dahil.
- **Scope dar.** Task'ın istediğinden fazlasına dokunmaz.
- **`figma.notify`** ile özet bas — kullanıcı ne olduğunu plugin kapanmadan görmeli.

## Sorun giderme

- **"This file doesn't have an 'id' field"** → manifest'teki `id` zorunlu; local dev için herhangi bir unique string yeter.
- **`figma is not defined`** → browser'da çalıştırmaya çalıştın; desktop app gerekli.
- **Plugin listede görünmüyor** → manifest'te `editorType` içinde aktif Figma mode'una uygun değer var mı (`"figma"` veya `"dev"`), `main` path'i doğru mu? Desktop'ta Plugins → Development → **Open console** ile hata görülebilir.
- **`editorType does not include dev`** → Import sırasında Figma Dev Mode açıkken alınır. Manifest güncel halinde `["figma", "dev"]` içerir; bu hatayı görüyorsan eski bir commit'tesin, `git pull` yap.
- **Mutasyon yaptı ama publish etmedim** → Figma "Assets publish" akışı manuel; plugin library'yi otomatik publish etmez.
