# ADR 0010 — Figma tasarım kaynağı + Figma Plugin bridge

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-22
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [docs/figma.md](../figma.md), [CLAUDE.md — Design Source of Truth](../../CLAUDE.md#design-source-of-truth-mandatory), ADR 0008

## Bağlam

Glaon bir frontend projesi — renk, aralık, tipografi, gölge, component görselleri hepsi belirli bir yerde "doğru" diye tanımlı olmalı. İki uçta iki yaklaşım var:

- **Kod tasarımı dikte eder:** Design tokens elle yazılır (`colors.primary = '#2563eb'`), Figma dokümantasyon. Çabuk başlatılır; drift kaçınılmaz. Tasarımcı (veya gelecekte olacak kişi) kod tabanında çalışmak zorunda.
- **Figma tasarımı dikte eder:** Figma Variables + Tokens plugin üzerinden export → Style Dictionary ile transform → per-platform output. Kod token **referanslarını** kullanır, raw değeri yazmaz. Tasarımcı Figma'da çalışır, tasarım değişince export + PR akışı işler.

Chromatic Figma design-code diff entegrasyonu (ADR 0008) tasarımla kod arasında "Not implemented" / "Design changed" sinyalini CI'a getiriyor. Bu sinyalin anlamlı olması için tasarım tek bir kanonik yerde olmak zorunda — Figma.

Ek bir Claude-spesifik konu: Claude Code Figma'ya tasarım yazabilmeli mi?

- **REST API ile yazma:** Figma REST API genelde read-only + comment yazma. Node mutation (frame oluşturma, style güncelleme) REST'ten yapılamıyor.
- **Figma Plugin API (Design + Dev Mode):** Plugin içinden tüm okuma/yazma mümkün. Plugin dev-mode manifest ile Dev Mode'da da çalışabiliyor (`editorType: ["figma", "dev"]`).
- **Claude-authored plugin script:** Claude bir Figma Plugin script'i yazıyor, kullanıcı plugin'i import edip çalıştırıyor. Sonuç Figma dosyasına doğrudan yazılıyor (commit yok, Figma'nın kendi undo stack'i kullanılıyor).

Plugin yolu neden tercih edildi:

- Yazma kabiliyeti REST'te yok.
- Kullanıcı plugin'i manuel çalıştırdığı için bir "review step" doğal olarak gerçekleşiyor (AI fantasy değişiklik yapamaz; kullanıcı ne yürüttüğünü görür).
- Plugin ağ erişimi kapalı (`networkAccess: { allowedDomains: ["none"] }`) — Claude'un ürettiği kod sadece Figma üzerinde iş yapıyor, dışarıya veri sızdırmıyor.
- Guardrail pattern: dry-run default, `CONFIRM` flag ile gerçek mutation, `notify` + `closePlugin` ile her koşul altında feedback.

## Karar

**Figma Glaon için tasarımın tek kanonik kaynağıdır. Claude-authored değişiklikler Figma Plugin bridge üzerinden yapılır; REST API yazma scope'u dışında.**

- `@glaon/design-tokens` paketi (ileride) Figma Variables'dan export edilen JSON'u Style Dictionary ile per-platform output'a (CSS custom properties, TypeScript module, React Native StyleSheet) çeviriyor.
- Hex kodu, raw spacing sayıları, tipografi değerleri **kod tabanında elle yazılmaz** — token referansı üzerinden erişiliyor.
- Yeni primitive Figma'da önce tasarlanır — code-only primitive mergeable değil. Design review gate var.
- Figma component description'ı `storybook-id: <kebab-case>` satırını taşıyor; Chromatic Figma plugin bu eşlemeyle design-code diff üretiyor.
- Claude-authored write workflow:
  - `.claude/skills/brand-design/SKILL.md` brand-level sorular + Figma Plugin script sözleşmesi.
  - `tools/figma-plugin/` iskelet plugin: `manifest.json` (`editorType: ["figma", "dev"]`, `networkAccess: none`), `code.js` Claude tarafından task başına overwrite ediliyor.
  - Kullanıcı plugin'i **Plugins → Development → Import plugin from manifest** ile local path'ten yüklüyor. Figma Dosyası dev mode'da da aynı plugin çalışıyor.
  - Her task için script: dry-run default, `CONFIRM: true` flag'i manuel set edilince gerçek mutation, `figma.notify` ile feedback, `figma.closePlugin` ile kapanış.

## Sonuçlar

### Olumlu

- Drift kontrol altında: design changes kod PR'ı tetikliyor (token export + regeneration), code changes tasarım review'ı tetikliyor (design-code diff).
- Chromatic Figma entegrasyonu `storybook-id` üzerinden component-by-component eşleştirme yapabiliyor.
- Claude Figma'ya tek tıkla yazabiliyor; kullanıcı plugin'i manuel tetiklemek zorunda olduğu için review step doğal.
- Plugin network'ü kapalı — supply chain yüzeyi sıfır.
- REST scope dar tutulduğu için Claude Figma'ya sessizce yazamaz; kullanıcı kontrolü her zaman var.

### Olumsuz / ödenecek bedel

- Plugin import workflow biraz manuel — plugin script'i değişince kullanıcı yeniden import etmek durumunda.
- Design-code diff aracı Chromatic SaaS'a bağımlı; hesap downtime'ında sinyali kaybediyoruz.
- Figma Variables → Style Dictionary pipeline'ı kurulum gerektiriyor; ilk sürümde (design tokens henüz tanımlanmamışken) yapı kurulmuş ama boş.
- Brand-level kararlar (color palette, typography scale, personality) Figma'dan önce Claude ile konuşulduktan sonra Figma'ya yazılıyor — bu "bir kere tasarım gözden geçirilmeli" gerekliliğini tek tasarımcı (şimdilik) üzerinde yoğunlaştırıyor.

### Etkileri

- [CLAUDE.md — Design Source of Truth](../../CLAUDE.md#design-source-of-truth-mandatory) kuralı uygulanır; code-only primitive mergeable değil.
- `packages/ui` yeni primitive eklerken Figma component + description + storybook-id + Storybook story + Chromatic snapshot birlikte geliyor.
- `tools/figma-plugin/` klasörü plugin manifest + code.js + README'yi taşır; `tools/figma-plugin/README.md` import workflow ve troubleshooting'i (örn. `editorType does not include dev` hatası) dokümante ediyor.
- `.claude/skills/brand-design/SKILL.md` Claude'un tasarım sorularına nasıl yaklaşacağını belirliyor.

## Tekrar değerlendirme tetikleyicileri

- Figma fiyatlandırması veya API politikası değişirse (Dev Mode subscription zorunluluğu, plugin sandbox kısıtı).
- Chromatic Figma design-code diff özelliği deprecate edilirse (eşleşme yolu yeniden düşünülür).
- Çoklu tasarımcı ekibe geçilirse — Figma collaboration akışı şimdiki tek kişilik flow'dan farklılaşır.
- Design tokens için Figma Variables dışında endüstri standardı (W3C Design Tokens spec) Figma-native hale gelirse.

## Referanslar

- [docs/figma.md](../figma.md)
- [CLAUDE.md — Design Source of Truth](../../CLAUDE.md#design-source-of-truth-mandatory)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [W3C Design Tokens spec](https://tr.designtokens.org/format/)
