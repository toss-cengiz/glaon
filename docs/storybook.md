# Storybook

Glaon'un tüm UI component'leri — web ve (ileride) React Native — tek bir Storybook instance'ında yaşar. Storybook'ta yeri olmayan hiçbir component projeye giremez.

## Nerede yaşar?

- Konum: [packages/ui](../packages/ui/)
- Config: [packages/ui/.storybook/](../packages/ui/.storybook/)
- Framework: `@storybook/react-native-web-vite` (v10) — tek config hem web hem React Native story'yi render eder. `react-native` → `react-native-web` alias'ını otomatik kurar.
- Addon'lar:
  - `@storybook/addon-a11y` — accessibility paneli + `a11y.test: 'error'`
  - `@storybook/addon-designs` — story'nin yanında Figma frame embed'i (**Design** tab)
  - `@storybook/addon-mcp` — AI agent'ların Storybook'u MCP üzerinden kullanması
  - `storybook-dark-mode` — toolbar'dan tema değiştirici
- Not: v10'da "essentials" ve "interactions" core'a taşındı, ayrı paket gerekmez.

## Komutlar

```bash
# Geliştirme — http://localhost:6006
pnpm --filter @glaon/ui storybook

# Statik build (CI / deploy için)
pnpm --filter @glaon/ui build-storybook

# Story'leri test olarak koş (render + play + a11y, browser mode)
pnpm --filter @glaon/ui test:stories
```

Statik çıktı `packages/ui/storybook-static/` altında üretilir ve `.gitignore`'dadır.

## Story tests (Vitest browser mode)

Story'ler zaten component'lerin tüm kanonik state'lerini belgeliyor. `@storybook/addon-vitest` bu story'leri doğrudan Vitest'in browser modunda (Playwright ile Chromium üzerinde) çalıştırır: her story render edilir, tanımlıysa `play()` fonksiyonu yürütülür, a11y kontrolü (`addon-a11y` + axe) çağrılır. Paralel bir test ağacı yazmaya gerek kalmaz.

### Altyapı

- Vitest 4 `projects` ile `unit` (jsdom) ve `storybook` (browser) ayrı tutulur — biri diğerini engellemez, coverage sadece `unit` projesinde toplanır.
- Browser provider: `@vitest/browser-playwright` + Chromium. CI'da `~/.cache/ms-playwright` cache'lenir; lokalde `pnpm --filter @glaon/ui exec playwright install chromium` yeterli.
- Yapılandırma: [packages/ui/vitest.config.ts](../packages/ui/vitest.config.ts) — `storybookTest` plugin'i `.storybook/main.ts`'i okur ve framework config'ini (react-native-web alias dahil) aynen uygular. Yeni story dosyaları otomatik pick-up edilir; boilerplate yok.
- Storybook 10.3+ preview annotations'ı otomatik enjekte eder, ekstra `setup-file` gerekmez.

### Ne fail eder?

- **Render error** — story mount edilmiyorsa (missing import, throw during render, prop contract ihlali).
- **Play function assertion** — `play` içindeki `expect()` başarısız olursa.
- **A11y violation** — `parameters.a11y.test = 'error'` seviyesinde axe serious+ violation.

Görsel farklar bu katmanda asla fail etmez; onu Chromatic sahiplenir. Story tests "davranış ve a11y", Chromatic "pixel".

### CI

[`.github/workflows/storybook-tests.yml`](../.github/workflows/storybook-tests.yml) path-filtered: sadece `packages/ui/**`, `pnpm-lock.yaml` veya kendi workflow'u değiştiğinde koşar. Bu yaklaşım Lighthouse CI ile aynı desen (gereksiz tetiklemeyi engeller, Storybook dışı PR'ları hızlı tutar).

### Yerel iş akışı

```bash
# Tüm story'leri tek seferde koş
pnpm --filter @glaon/ui test:stories

# Watch mode (story değiştikçe otomatik re-run)
pnpm --filter @glaon/ui exec vitest --project=storybook

# Sadece bir story dosyası
pnpm --filter @glaon/ui exec vitest --project=storybook src/components/Button/Button.stories.tsx
```

### İyi pratikler

- `play()` fonksiyonları user-centric: `userEvent.click`, `findByRole`, `expect(button).toHaveFocus()` — implementation detail'ına (internal state, private ref) dokunma.
- Flaky bir story'yi geçici olarak `tags: ['!test']` ile koşumdan çıkarabilirsin; ama bu bir düzeltme değildir, bir issue aç ve commit mesajında referansla.
- Browser context'te `window` ve `document` vardır, `jest-dom` matchers koşum ortamına göre `@testing-library/jest-dom` üzerinden aktif olur.

## Story yazım kuralları

### Dosya yerleşimi

Her component kendi klasöründe ve story'siyle birlikte tutulur:

```
packages/ui/src/components/Button/
├── Button.tsx            # component
├── Button.stories.tsx    # story (zorunlu)
└── index.ts              # barrel export
```

### CSF 3.0 format

Storybook'un resmi "Component Story Format 3" kullanılır: `Meta` objesi + named export'lar.

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Click me', variant: 'primary' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Disabled: Story = { args: { disabled: true } };
```

### Minimum story seti

Her component için en az:

1. **Default (primary) state** — component'in en yaygın kullanım şekli.
2. **En az bir edge case** — duruma göre `Disabled`, `Loading`, `Error`, `Empty`.

### Accessibility

`@storybook/addon-a11y` aktif ve `preview.ts` içinde `a11y.test: 'error'` set edilmiş. Bir story açıldığında a11y panelinde kırmızı uyarı varsa story merge edilmez — component'i düzelt veya story'de farklı bir senaryo kur.

### Kategori yapısı (title)

`title` alanı Storybook sidebar'ında hiyerarşiyi belirler. Mevcut konvansiyon:

- `Web Primitives/*` — sadece web'de çalışan, DOM/HTML tabanlı component'ler (Button, Input, Badge…)
- `RN Primitives/*` — React Native API'leri (`Pressable`, `View`, `Text`…) ile yazılmış, `react-native-web` üzerinden Storybook'ta da render olan component'ler
- `Composites/*` — birden fazla primitive'den oluşan component (Card, Dialog…)
- `UI Kit/*` — Untitled UI wrap'leri (ayrı issue #48)

Aynı Storybook instance'ında Web ve RN story'leri yan yana yaşar; sidebar'da ilk kırılım platformu belirtir.

### Figma embed (`parameters.design`)

Her component, Figma Design System dosyasındaki karşılığı ile `@storybook/addon-designs` üzerinden bağlanır. Bağlantı kurulunca Storybook'ta story'nin yanında **Design** tab'ı belirir ve Figma frame inline render olur.

Konvansiyon: `meta.parameters.design` objesi — component seviyesinde, story seviyesinde değil. Sebep: bir component'in tüm variant'ları aynı kanonik Figma frame'e bakar.

```tsx
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Button } from './Button';

const meta = {
  title: 'Web Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/KP0SVNxQEjT0gotajwc9I0/Design-System?node-id=123-456&t=abc',
    },
  },
  args: { children: 'Click me', variant: 'primary' },
} satisfies Meta<typeof Button>;
```

URL'i Figma'da almak için:

1. Frame'i seç (component'in kanonik state'i — genelde Design System dosyasındaki published instance).
2. Sağ tıkla → **Copy link to selection**. URL'de `?node-id=X-Y` query parametresi olmak zorunda; bu parametre olmadan addon Figma dosyasının kökünü gösterir.
3. Component'in Figma description'ındaki `storybook-id` [docs/figma.md](figma.md#component-description--storybook-id)'de anlatılan formatla aynı component'i işaret etmeli — Chromatic'ın design-code diff akışı bu eşleşmeye bağımlı (#53).

Figma frame henüz çizilmediyse `parameters.design` boş bırakılır ve component Figma'da çizildikten sonra ayrı bir küçük PR'da wire edilir — "design yok, story de yok" değil; primitive design review gate'i zaten `docs/figma.md`'de bu sırayı zorluyor.

## React Native story yazımı

RN component'leri web'dekiyle aynı CSF 3.0 kalıbını kullanır; tek fark import ve kategori. `react-native` ve `react-native-web` paketlendiği için component dosyasında doğrudan `react-native`'den import edin:

```tsx
// PressableButton.tsx
import { Pressable, Text, StyleSheet } from 'react-native';

export function PressableButton({ children, ...rest }) {
  return (
    <Pressable accessibilityRole="button" {...rest}>
      <Text>{children}</Text>
    </Pressable>
  );
}
```

```tsx
// PressableButton.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { PressableButton } from './PressableButton';

const meta = {
  title: 'RN Primitives/PressableButton',
  component: PressableButton,
  tags: ['autodocs'],
  args: { children: 'Press me' },
} satisfies Meta<typeof PressableButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
```

### RN-specific kurallar

- Component dosyasında DOM API (`window`, `document`, `HTMLElement`, inline CSS string'leri) **kullanmayın** — `react-native-web` çevirmez, native tarafta çöker.
- Stilleri `StyleSheet.create` ile yazın; inline CSS object'leri RN'de invalid key'ler verdiğinde sessizce düşer.
- Accessibility için `accessibilityRole`, `accessibilityLabel` gibi RN prop'larını kullanın — addon-a11y bunları axe üzerinden doğru kontrol eder.
- Event handler'lar RN isimlendirmesiyle: `onPress` (not `onClick`), `onLongPress`, `onPressIn`/`Out`.
- Story kanvasında absolute pozisyon kullanıyorsanız dış `View` ile sarın; `position: 'fixed'` RN'de yok.

## "Component var, story yok" durumu

Şu an CI'da sadece soft check planlanıyor (ayrı issue, follow-up). Kural kültür seviyesinde zorunlu:

- PR'da yeni bir `*.tsx` eklenmiş ama eşdeğer `*.stories.tsx` yoksa review'da block edilir.
- Mevcut component'e prop/variant eklenmişse story da güncellenir.
- Bu kural [CLAUDE.md](../CLAUDE.md) içinde "Storybook Rule (MANDATORY)" başlığı altındadır.

## MCP (AI agent entegrasyonu)

`@storybook/addon-mcp` Storybook dev server'ı çalışırken `http://localhost:6006/mcp` adresinde bir MCP (Model Context Protocol) endpoint açar. Bu sayede Claude Code gibi AI agent'lar component'leri, prop'ları ve dokümanları programatik olarak keşfedebilir.

Aktif toolset'ler:

- `dev` → `preview-stories` aracı: mevcut story'leri listele, argları gör.
- `docs` → autodocs / mdx içeriklerini sorgula.
- `test` → `run-story-tests` aracı: `@storybook/addon-vitest` + Vitest browser mode + Playwright zinciri üzerinden story'leri test olarak koşar. Storybook dev server'ı açıkken agent direkt tetikleyebilir.

Agent'ı bağlamak için MCP client konfigürasyonunuza Storybook dev server URL'ini ekleyin (client-specific; örn. Claude Code için `.mcp.json` veya `claude mcp add` komutu).

Güvenlik: MCP endpoint sadece lokal dev server'da aktiftir; prod static build'de (`build-storybook` çıktısı) MCP yoktur. Başka bir makineden bağlantı için port forward/SSH tüneli kullanın — endpoint'i public'e açmayın.

## Dark mode

`storybook-dark-mode` addon'u Storybook toolbar'ına ay/güneş butonu ekler. Tercih otomatik olarak `localStorage`'a yazılır (Storybook'un kendi prefs alanı, uygulama kodu değil). Glaon web/mobile uygulamalarının kendi tema sistemi bundan bağımsız — bu sadece story kanvasının arka planını değiştirir.

Story'ye özel farklı default istiyorsanız:

```ts
export const DarkOnly: Story = {
  parameters: { darkMode: { current: 'dark' } },
};
```

## Follow-up işler (bu issue kapsamı dışı)

| Konu                                         | Issue                     |
| -------------------------------------------- | ------------------------- |
| Untitled UI component wrap'leri + story'leri | #48                       |
| CI soft/hard fail: UI değişti, story yok     | açılacak (sonraki sprint) |

## Sorun giderme

- **`storybook` komutu "Cannot find module"** → `pnpm install` çalıştırdın mı? Paketler `packages/ui`'nin devDeps'inde; workspace kurulumu zorunlu.
- **Story'de tip hatası** → `satisfies Meta<typeof Component>` kalıbını kullan; props inference'ı doğru çalışır.
- **a11y uyarıları takılıyor** → kasıtlı istisna varsa story'de `parameters.a11y.test = 'off'` kullan ve yorum yaz; default'u sessizce gevşetme.
