# Glaon Figma Plugin — Scaffold

Bu dizin, Claude-authored design değişikliklerinin Figma'ya taşınması için kullanılan yerel Figma Plugin iskeletidir. Plugin **hiçbir yerde publish edilmez**; sadece geliştirici makinesinde "Development" plugin olarak yüklenir ve manuel çalıştırılır.

Detaylı workflow ve kurallar: [docs/figma.md](../../docs/figma.md#claude-authored-design).

## Dosyalar

- `manifest.json` — Figma Plugin manifest (API 1.0). Network access kapalı; dynamic-page access açık (büyük dosyalarda page-by-page yükler).
- `code.js` — plugin entry. Scaffold hali sadece notification gösterip kapanır. Her task için Claude bu dosyanın içeriğini yeniden yazar; commit etmeyiz, lokal kullanılır ve `git restore` ile scaffold'a dönülür.
- `brand-design` skill (`.claude/skills/brand-design/SKILL.md`) — plugin script'i üretirken Claude'un uymak zorunda olduğu guardrail'leri tanımlar (dry-run default, `CONFIRM` flag, no network, notify+closePlugin).

## Figma'ya nasıl yüklenir?

1. Figma desktop app'i aç (browser'da plugin development desteklenmiyor).
2. Menu: **Plugins → Development → Import plugin from manifest…**
3. `tools/figma-plugin/manifest.json` dosyasını seç.
4. Plugin listede "Glaon" olarak görünür.
5. Çalıştırmak için: açık olduğun dosyada **Plugins → Development → Glaon**.

İlk import sonrası değişiklikleri görmek için plugin'i yeniden açman yeterli — Figma her açılışta `code.js`'i diskten okur. Manifest değiştiğinde Figma uyarır ve tekrar import istenebilir.

## Task akışı (Claude-authored script)

1. İhtiyaç doğar: "bu variable'ları yeniden adlandır", "bu renk palette'ini ekle", vb.
2. Claude görevi `brand-design` skill'i üzerinden analiz eder ve `code.js`'e uygun script'i yazar.
3. Script default **dry-run**: mutasyon yerine ne değişeceğinin özetini `figma.notify` ile gösterir.
4. Dry-run çıktısını doğruladıktan sonra script'in başındaki `CONFIRM = true` flag'ini elle aç ve yeniden çalıştır.
5. Figma'da değişiklikleri review et → tatmin ediciyse Design System dosyasını **publish** et (library bump); değilse `Ctrl+Z` / Figma history ile geri al.
6. `code.js`'i scaffold haline döndür (`git restore tools/figma-plugin/code.js`) — task'a özel script'ler repo'ya commit edilmez. Yeniden kullanılabilir bir operasyon çıkarsa ayrı issue + düzgün bir script modülü olarak eklenir.

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
- **Plugin listede görünmüyor** → manifest'te `editorType` içinde `"figma"` var mı, `main` path'i doğru mu? Desktop'ta Plugins → Development → **Open console** ile hata görülebilir.
- **Mutasyon yaptı ama publish etmedim** → Figma "Assets publish" akışı manuel; plugin library'yi otomatik publish etmez.
