# ADR 0011 — Untitled UI React kit'i CLI ile source-based teslim et

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-27
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue #14, [packages/ui/README.md](../../packages/ui/README.md), [docs/design-system-bootstrap.md](../design-system-bootstrap.md), [docs/figma.md](../figma.md)

## Bağlam

Glaon'un `@glaon/ui` paketi Phase 1 boyunca on'a yakın primitive'i (Button, Input, Modal, Drawer, Popover, Tooltip, Select, Tabs, vs.) kod tarafına getirir. Her primitive'in a11y, focus-trap, portal ve klavye davranışı ciddi yatırım gerektirir; lisanslı **Untitled UI React kit**'i bu yatırımın source materyali olarak kullanmak istiyoruz.

Untitled UI'nin teslim modeli incelendi:

- Kit **npm paketi olarak yayınlanmıyor**. Yayıncının resmi yolu `npx untitledui` CLI'dır. CLI iki yönde çalışır:
  - `untitledui init` boş bir Vite veya Next.js projesi iskeleti yaratır.
  - `untitledui add <component>` belirtilen component'in source code'unu projeye yazar (`--path` ile hedef dizin override edilebilir). License key (Pro hesap) gerekir.
- Yani teslimat **source-based**: kit'in kodu projenize kopyalanır, harici bir runtime bağımlılığı kalmaz.
- Resmi MCP server'ı (`https://www.untitledui.com/react/api/mcp`) bu CLI'nın yanında ek bir kanal olarak component metadata'sı ve search exposure'ı sunar; ayrı bir issue (#206) altında değerlendirilir.

Bu durum kararı şekillendiren kısıtlar:

- **Lisans gerçeği**: Kit Pro lisanslı, ücretli. Source code'un Glaon kod tabanına entegre edilmesi lisansın izin verdiği "embed in product source" senaryosuyla uyumlu görünüyor; ama yayıncının dokümantasyonu public-repo commit'i için açık bir hüküm içermiyor. Bu ADR'nin Sonuçlar bölümü ihtiyaten dokümantasyon takibini ve gerekirse repo private'a alma fallback'ını sıralar.
- **CI ihtiyacı**: Storybook build, Chromatic visual regression, Vitest browser tests her PR'da koşar. Source committed olursa CI ek auth gerekmez; gitignored + regenerate olursa her CI run'unda CLI quota + ağ gecikmesi.
- **Onboarding eşiği**: Kit'in source'u zaten repoda olursa yeni geliştiricinin tek yapması gereken `pnpm install` + Storybook çalıştırmak. Aksi halde Pro lisans key'i ve `untitledui login` adımı eklenir.
- **Versioning**: Kit upgrade'leri `untitledui upgrade` komutuyla yapılır; sonuç diff PR review'dan geçer. Renovate entegrasyonu yok ama upgrade frequency düşük (kit minor bump'ları, manuel review zaten istenecek seviyede).

Göz önünde bulundurulan alternatifler:

- **Seçenek A — GitHub Packages private npm registry**: İlk önerimizdi (eski PR #205'te kaydedildi, kapanış sebebiyle hayata geçmedi). Kit'i org'un private GitHub Packages'a yayınlama. Sorun: kit npm package değil, yayınlanması için yayıncının "wrap-and-republish" iznini gerektirir, lisans şartlarında açık değil. Eleminate.
- **Seçenek B — Private Git submodule**: Org altında private bir kit-vendor repo. Submodule auth, manuel versioning, Renovate entegrasyonu sınırlı. CLI tabanlı resmi yola karşı ek ekstra katman.
- **Seçenek C — Source committed via CLI (seçilen)**: `npx untitledui add --path packages/ui/src/components/<Name>` ile component source'unu doğrudan projeye yaz; commit et. Karar bölümünde detay.
- **Seçenek D — Gitignored + CI regenerate**: Source gitignored, CI `untitledui add` ile her run'da yeniden üretir. Lisans temiz olur ama CI runtime'a bağımlı: ağ kesilmesi, CLI quota, license key rotation hatalarının hepsi build'i blokluyor.

## Karar

Untitled UI React kit'i `npx untitledui add` CLI'sı üzerinden source-based teslim alıyoruz; üretilen source dosyaları Glaon repo'suna commit ediyoruz. `@glaon/ui` paketinin component implementasyonları kit source'unu wrap eder ve Glaon design token'larıyla yeniden temalar.

Kararın teknik detayları:

- **Init skip**: `untitledui init` Vite veya Next.js projesi sıfırdan kurar. Glaon zaten Turborepo + Vite + Storybook ile kurulu; init çalıştırmıyoruz, sadece `add` kullanıyoruz.
- **Per-component add**: `npx untitledui add <component> --path packages/ui/src/components/<Name> --yes` ile component source'u projeye yazılır.
- **Path konvansiyonu**: Tüm kit source'u `packages/ui/src/components/` altında, primitive başına klasör olarak yaşar. CLI'ın varsayılan path'i (örn. `src/components/...`) Glaon'un monorepo path'ine override edilir.
- **Lisans key teslimi**: Yeni geliştirici `~/.config/untitledui/auth` (CLI default) veya `--license <key>` flag'i ile login olur. CI source kit'i regenerate etmiyor → CI'da key gerekmez. Ekip içinde key paylaşımı gerekiyorsa şifre yöneticisinde tutulur.
- **Lisans attribution**: Kit'in lisans dosyası (yayıncının sağladığı) `LICENSE-untitledui.md` olarak repo'ya commit edilir; her commit'lenmiş component dosyasında CLI'ın eklediği license header korunur, ayrıca `packages/ui/README.md`'de attribution paragrafı.
- **Glaon wrap pattern**: Kit'in primitive'i raw olarak değil, Glaon-spesifik wrapper component üzerinden export edilir. Wrap, token tüketimi + Glaon prop API contract'ı + storybook-id Figma mapping'ini garantiler. Direkt kit import sadece wrap'in içinde geçerli.
- **Upgrade akışı**: Kit upgrade'leri `npx untitledui upgrade` komutuyla, yeni issue + PR olarak iner. Manuel review zorunlu (yayıncı breaking change'leri açıkça etiketler).
- **Public repo tutumu**: Repo public; ADR yazıldığı tarihte yayıncının lisans dokümantasyonu commit-to-public-repo için açık hüküm içermiyor. İlk component'leri eklemeden önce yayıncı ile yazılı onay alınması veya repo private'a çekilmesi gerekirse, bu fallback Sonuçlar bölümündeki tetikleyiciye dahil. Şu an default tutumumuz commit etmek; lisans ihlali tespit edilirse gitignored + CI regenerate seçeneğine (Seçenek D) geçilir.

## Sonuçlar

### Olumlu

- **CI sade**: Source repoda → her CI run'unda kit auth/regenerate adımı yok. Storybook build, Chromatic, Vitest browser tests gecikmesiz.
- **Onboarding hızlı**: Yeni geliştirici `pnpm install` + Storybook ile çalışır hâle gelir, Pro lisans key'i upgrade/yeni component eklemek dışında gerekmez.
- **PR review'da diff**: Kit upgrade'leri ve yeni primitive eklemeleri review edilebilir text diff'i olarak geçer; "ne değişti?" sorusu git history'de okunur.
- **Lock-in component-API seviyesinde değil**: Glaon wrap'leri kit'i abstraction altında tutuyor; yarın kit değişirse yalnızca wrap'lerin internal'ı değişir, consumer'lar etkilenmez.
- **Resmi yolla uyum**: Yayıncının önerdiği akış (CLI + add) kullanılıyor; topluluk + yayıncı destek için bu modelde örneklere bakar.

### Olumsuz / ödenecek bedel

- **Public repo lisans riski**: Kit Pro source code'unun public repoda görünür olması yayıncının lisans şartlarını açıkça karşılamayabilir. Yayıncı dokümantasyonu netleşmediği sürece bu bir potansiyel maddi risk; karar tarihinde kabul edildi, takibi açık kalmalı.
- **Kit upgrade manuel**: Renovate native upgrade'i yok; `untitledui upgrade` her seferinde insan tetiklemeli + diff review gerektirir. Kit minor bump'ları ekibe yük olabilir.
- **CLI bağımlılığı**: Yayıncı CLI'ı API'sini değiştirirse upgrade akışı bozulabilir. Yayıncının runtime'a değil, sadece publishing pipeline'a etkisi olduğu için risk sınırlı.
- **Çift dosyalar**: Aynı primitive'in raw kit source'u + Glaon wrap'i ayrı ayrı dosyalarda yaşar; paket boyutu (Storybook bundle) iki katı satır artışı.

### Etkileri

- **Kod organizasyonu**: `packages/ui/src/components/<Primitive>/` altında her primitive iki katman: kit source (CLI tarafından yazılan) + Glaon wrap (`<Primitive>.tsx`/`.native.tsx`). Wrap'ler shared `<Primitive>.types.ts` üzerinden konuşur; kit source'a direct import sadece wrap içinde.
- **CI süresi**: Ek bir CI step yok. Storybook build kit source'u mevcut olarak kabul eder.
- **Göç yolu**: Kitten vazgeçilirse `untitledui` CLI çalıştırılmaz, mevcut source dosyaları repo'da kalır (snapshot olarak), yeni primitive'ler hand-roll yazılır. Lock-in component-API'nin ötesinde değil.
- **Lisans dökümanı**: `LICENSE-untitledui.md` ve `packages/ui/README.md` attribution paragrafı her release'de güncel kalmalı; release-please workflow'una manuel kontrol eklemek pragmatik (otomatik kontrol kit'in license metadata'sına dayanır, henüz var değil).

## Tekrar değerlendirme tetikleyicileri

- Untitled UI yayıncısı public-repo commit'i için yazılı/standart bir lisans hükmü yayınlar veya yasaklar (ihlal varsa Seçenek D'ye geçilir).
- Glaon repo'su private'a geçer (kararı yeniden masaya yatırma ihtiyacı yok ama riskler değişir; ADR güncel kalır).
- Kit minor bump frequency'si haftalıktan sıkılaşır ve manuel review yükü dayanılmaz olur — Renovate-tipi otomasyon araştırması gerekir.
- Kit'in CLI'ı kullanım dışı bırakılır veya farklı bir resmi yöntem yayınlanır.
- `@glaon/ui` kit kullanımı yüzeyi sadece 1-2 primitive'e iner — hand-roll daha düşük maliyetli olur.

## Referanslar

- Issue #14 — `feat(ui): integrate Untitled UI React kit into @glaon/ui`.
- Issue #206 — `chore(mcp): add Untitled UI Remote MCP entry to .mcp.json` (paralel iz).
- ADR 0001 — Turborepo + pnpm workspaces (paket yönetimi temeli).
- ADR 0010 — Figma tasarım kaynağı + plugin bridge (UUI'nin tek Figma dosyası, source-of-truth).
- Untitled UI CLI: `npx untitledui --help`.
- Untitled UI MCP: <https://www.untitledui.com/react/integrations/mcp>.
- Yayıncı lisans dokümantasyonu: lokal kayıtta (Pro hesap dashboard'u).
- `packages/ui/README.md` — kit kurulum + per-developer + CI runbook'u.
