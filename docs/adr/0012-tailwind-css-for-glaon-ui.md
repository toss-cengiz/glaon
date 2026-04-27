# ADR 0012 — Tailwind CSS'i `@glaon/ui` paketinde benimse

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-27
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue #216, issue #215, [ADR 0011](0011-untitled-ui-react-kit.md), [packages/ui/README.md](../../packages/ui/README.md)

## Bağlam

ADR 0011 Untitled UI Pro React kit'ini CLI source-based teslimle benimsedi. İlk component import (#215, Button) keşfetti: UUI Pro source'u **tamamen Tailwind utility class'larıyla yazılı**. Kit'in temel yapı taşları:

- `tailwindcss` (v3) utility class'ları her component'te (`px-3 py-2 text-sm font-semibold gap-1 ...`).
- `tailwind-merge` (v3) — class deduplication / override resolution.
- `@/utils/cx` — className helper, `tailwind-merge` üzerinden compose.
- `react-aria-components` — Adobe Aria headless primitive katmanı (Button, Dialog, Popover vb.).

Glaon'un mevcut stack'i (Vite + React 19 + TypeScript) Tailwind içermiyor. Kit'i kullanmak ya Tailwind benimsemeyi gerektiriyor ya da source'u manuel CSS-in-JS'e port etmek (her component için, her upgrade'de tekrar).

Göz önünde bulundurulan alternatifler:

- **Seçenek A — Tailwind kabul (seçilen)**: Kit'in beklediği stack'i benimse. F2 (Style Dictionary) çıktısı `dist/tokens/web.css` Tailwind theme config'i üzerinden tüketilir. Kit upgrade'i `npx untitledui upgrade` doğrudan çalışır.
- **Seçenek B — UUI Pro'dan vazgeç + Radix UI**: Kit kullanılmıyor; Radix headless + custom CSS-in-JS. ADR 0011 superseded olur. Tasarım fidelity kullanıcının elinde manuel kalır; her primitive sıfırdan yazılır.
- **Seçenek C — Manuel CSS-in-JS port**: Kit source'u alınır ama Tailwind class'ları `vanilla-extract` / inline-style / CSS Module'a port edilir. Her primitive'de yüzlerce class manuel çevirilir; kit upgrade'i mevcut port'u patlatır. Sürdürülemez.

## Karar

`@glaon/ui` paketinin styling layer'ı **Tailwind CSS v3** olarak benimsenir. UUI Pro kit'i mevcut Tailwind class'larıyla doğrudan tüketilir; Glaon brand token'ları F2'nin emit ettiği `dist/tokens/web.css` CSS variable'larından Tailwind config'i üzerinden eşlenir.

Kararın teknik detayları:

- **Versiyon**: Tailwind v3 (latest stable). UUI kit `tailwind-merge@^3` istiyor; v3 ekosistemiyle uyum.
- **Dep'ler `@glaon/ui` devDep**: `tailwindcss@^3`, `postcss`, `autoprefixer`, `tailwind-merge@^3`, `react-aria-components`.
- **Tailwind config** (`packages/ui/tailwind.config.js`):
  - `content`: `./src/**/*.{ts,tsx}` + `./.storybook/**/*.{ts,tsx}` taraması.
  - `theme.colors`: F2'nin token isimleri (`brand`, `neutral`, `red`, `base`, vs.) CSS variable referanslarıyla — örn. `brand: { 500: 'var(--brand-500)', 700: 'var(--brand-700)' }`. Böylece dark mode binding F2'de eklendiğinde Tailwind class'ları (`bg-brand-500`) otomatik dark theme override'ı alır.
  - `theme.extend`: tipografi (Inter), spacing/radii (Style Dictionary çıktısından).
- **PostCSS config** (`packages/ui/postcss.config.js`): `tailwindcss` + `autoprefixer` plugin chain. Vite ve Storybook bunu otomatik tüketir.
- **Tailwind directives** (`packages/ui/src/tailwind.css`): `@tailwind base; @tailwind components; @tailwind utilities;` — Storybook preview ve gelecek apps tüketir.
- **`react-aria-components`** runtime peer dep. Pro kit Aria primitive'leri üzerinden inşa eder (focus management, keyboard, ARIA semantics).
- **`@glaon/ui` boundary**: Tailwind class'ları **sadece bu paket içinde** kullanılır. `apps/web` ve `apps/mobile` paket arayüzü üzerinden tüketir; Tailwind'i app shell'lerine ayrı bir issue ile (Phase 2) kararlaştırırız.
- **CLAUDE.md Stack** güncellenir: "UI: `@glaon/ui` wraps the licensed Untitled UI React kit on a Tailwind CSS + react-aria-components foundation".

## Sonuçlar

### Olumlu

- **Kit fidelity**: UUI Pro source'u doğrudan tüketilir, kit upgrade'leri pürüzsüz. Manuel port maliyeti sıfır.
- **Token akış uyumu**: F2 token'ları → CSS vars → Tailwind theme; component'ler `bg-brand-500` yazdığında dark binding otomatik aktif olur (F2 dark emit edince).
- **A11y temeli**: `react-aria-components` Adobe Aria pattern'lerini ücretsiz getiriyor (focus trap, escape close, keyboard navigation, role semantics). Hand-roll'da yüzlerce satır maliyet.
- **Onboarding**: Tailwind ekosistemi geniş, dokümante. Yeni geliştirici muhtemelen zaten biliyor.
- **Hot reload + DX**: Vite + Tailwind JIT inline kullanım, lokal dev hızlı.

### Olumsuz / ödenecek bedel

- **Bundle size**: Tailwind utility class'ları dev modda büyür; production'da PurgeCSS / `content` filter'ı ile minimize. Yine de bare-bones'tan büyük.
- **Stack ekleme**: PostCSS pipeline + Tailwind config bakımı gerekir. Vite + Storybook'un her ikisi config'i tüketir; biri kırılırsa diğeri düşer.
- **Tailwind v3 → v4 migration**: v4 release oldu (CSS-based config). Kit v4'e geçtiğinde Glaon'un da geçmesi gerek; planlı bir migration ADR'sı olur.
- **App-shell uyumu**: `apps/web` ve `apps/mobile` Tailwind yok. `@glaon/ui` Tailwind class'larını render eder ama app shell tarafında preview yok — Tailwind CSS app entry'sine import edilmeli (Phase 2).
- **Yeni runtime dep (`react-aria-components`)**: bundle size + version locking ek bir yüzey.

### Etkileri

- **Kod organizasyonu**: `@glaon/ui/src/` altında Tailwind class'ları doğal kullanım; component'ler kit pattern'leriyle yazılır. Tokens'a doğrudan `var(--...)` referansı yerine `bg-brand-500` gibi class'lar.
- **CI süresi**: Tailwind JIT compile dev'de hızlı. CI'da `build-storybook` Tailwind compile'ı çalıştırır; ek ~1-3 saniye.
- **Göç yolu**: Kit'ten vazgeçilirse Tailwind'in benimsenmesi ayrı kalabilir (utility framework olarak). Tailwind kararı kit kararından bağımsız sürdürülebilir.

## Tekrar değerlendirme tetikleyicileri

- Tailwind v4'e mecburi geçiş gerekirse (kit v4 zorunlu olursa).
- UUI Pro kit'inden vazgeçilirse (ADR 0011 supersede) — Tailwind kararı yeniden değerlendirilebilir ama bağımsız değerli.
- `react-aria-components` major bump'ları breaking change'le gelirse.
- `@glaon/ui` consumer'ları (apps) Tailwind ile çakışan başka bir framework'e geçerse.

## Referanslar

- Issue #216 — bu ADR'nin uygulayıcı slice'ı.
- Issue #215 — UUI Button import (Tailwind setup'ına bağımlı).
- ADR 0011 — UUI CLI source-based delivery (parent context).
- ADR 0001 — Turborepo + pnpm workspaces.
- Tailwind CSS docs: <https://tailwindcss.com/docs/installation>
- React Aria Components: <https://react-spectrum.adobe.com/react-aria/>
- UUI integrations: <https://www.untitledui.com/react/integrations>
