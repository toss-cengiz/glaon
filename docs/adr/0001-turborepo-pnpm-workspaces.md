# ADR 0001 — Turborepo + pnpm workspaces

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-20
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** repo bootstrap commit, [CLAUDE.md](../../CLAUDE.md#stack)

## Bağlam

Glaon tek depoda web, tablet (kiosk), mobile ve paylaşılan paketler taşıyacak. İlk seçim tek-kök mono-repo mu yoksa çok-depolu (multi-repo) mu olduğuydu. Paylaşılan `@glaon/core` paketinin hem Vite (web) hem Metro (React Native) tarafından tüketilmesi, token + OAuth mantığının tek yerden akması gerektiği, ve release cycle'ın tek versiyon akışıyla yürüyeceği mono-repo tarafına kayırdı.

Mono-repo aracı seçiminde değerlendirilenler:

- **Nx:** Güçlü, tam özellik seti. Uygulama generatörleri, ML temelli test seçici, cloud cache. Dezavantaj: konfigürasyon ağır, kendi jargonunu dayatıyor (plugin sistemi, "targets"), Vite ve Expo ekosistemiyle Turborepo'ya kıyasla daha fazla adaptör gerektiriyor.
- **Bazel:** Ölçek için mükemmel, reprodüksiyon kalitesi en yüksek. Dezavantaj: ön yatırım çok yüksek, JS/TS ekosistemine yabancı, tek kişilik projede değer üretmeden maliyet üretir.
- **Lerna (klasik):** Artık bakım modunda; Nx tarafından satın alındı. Yeni proje için tavsiye edilmez.
- **Turborepo + pnpm workspaces:** Minimal konfig, `pnpm` workspaces'ın protocol:workspace\* sembolünü doğrudan kullanır, remote cache opsiyonel ama gerektiğinde var. Ekosistem tercihi Vite/Expo ile uyumlu — resmi örneklerde Turborepo sık sık referans alınır.
- **Yarn/npm workspaces + raw scripts:** Orkestrasyon yok. `pnpm run --parallel` ile başlasak bile task dependency graph yok, incremental build yok. Hızlı başlangıç ama 10+ paket sonrası yönetilemez hale gelir.

## Karar

**Turborepo 2.x + pnpm 9 workspaces** ile mono-repo kurulur.

- Paket yöneticisi olarak pnpm (Node 22 LTS üzerinde) — `strict-peer-dependencies`, disk alanı verimliliği, ve workspaces protocol:workspace\* desteği için.
- Task orkestrasyonu ve incremental build için Turborepo. `turbo.json` pipeline'ları: `build`, `dev`, `lint`, `type-check`, `test`, `test:e2e`.
- Remote cache başlangıçta kapalı, ayrı bir iş olarak açılacak (bkz. #88).

## Sonuçlar

### Olumlu

- Paylaşılan paketler (`@glaon/core`, `@glaon/ui`, `@glaon/config`) tek kök altında refactor edilebilir, paket versiyon eşitlemesi gereksiz.
- `pnpm install` ile tek lock dosyası; supply-chain denetimi tek noktadan.
- Turborepo incremental cache, CI sürelerini makul tutar; paketler büyüdükçe remote cache'e geçiş kolay.
- Topluluk desteği yüksek, Vite/Expo/Storybook repo örneklerinin çoğu bu kombinasyonu kullanıyor.

### Olumsuz / ödenecek bedel

- `pnpm`'in strict mode'u bazen peer dep uyarıları üretiyor — IDE'nin anlayabilmesi için ek konfig gerekiyor.
- Turborepo remote cache Vercel ekosistemine bağlı (şu an tek seçenek uygun olarak `@vercel/remote-cache`); self-host için eklenti gerekir. Bağımlılık kabul edildi, alternatif mevcut.

### Etkileri

- `packages/*` ve `apps/*` dizin yapısı standartlaştı.
- Yeni paket eklemek bir `package.json` + pnpm `workspaces` içine otomatik pickup — manuel register adımı yok.
- CI'da `pnpm install --frozen-lockfile` + `pnpm turbo run <task>` standart pipeline.

## Tekrar değerlendirme tetikleyicileri

- Ekip 5 kişiye çıkar ve Nx cloud özelliklerinden biri (distributed task execution, smart retry) zorunlu hale gelirse.
- Bazel geçişini zorunlu kılacak düzeyde cross-language build gerektirirse (native modül, Rust, Go vs. JS/TS yan yana).
- Turborepo v3 breaking change'i `turbo.json` formatını büyük ölçüde değiştirirse.

## Referanslar

- [Turborepo docs](https://turborepo.com/docs)
- [pnpm workspaces](https://pnpm.io/workspaces)
- [CLAUDE.md — Stack bölümü](../../CLAUDE.md#stack)
