# Storybook

Glaon'un tüm UI component'leri — web ve (ileride) React Native — tek bir Storybook instance'ında yaşar. Storybook'ta yeri olmayan hiçbir component projeye giremez.

## Nerede yaşar?

- Konum: [packages/ui](../packages/ui/)
- Config: [packages/ui/.storybook/](../packages/ui/.storybook/)
- Framework: `@storybook/react-native-web-vite` (v10) — tek config hem web hem React Native story'yi render eder. `react-native` → `react-native-web` alias'ını otomatik kurar.
- Addon'lar:
  - `@storybook/addon-a11y` — accessibility paneli + `a11y.test: 'error'`
  - `@storybook/addon-mcp` — AI agent'ların Storybook'u MCP üzerinden kullanması
  - `storybook-dark-mode` — toolbar'dan tema değiştirici
- Not: v10'da "essentials" ve "interactions" core'a taşındı, ayrı paket gerekmez.

## Komutlar

```bash
# Geliştirme — http://localhost:6006
pnpm --filter @glaon/ui storybook

# Statik build (CI / deploy için)
pnpm --filter @glaon/ui build-storybook
```

Statik çıktı `packages/ui/storybook-static/` altında üretilir ve `.gitignore`'dadır.

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
- `test` → **kapalı**. `run-story-tests` aracı için `@storybook/addon-vitest` + Vitest browser mode + Playwright gerekli; bu zincir ayrı issue'ya bırakıldı (storybook-static build'e etkisi ve dosya sayısı büyük). İhtiyaç duyulduğunda açılacak.

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
