# Storybook

Glaon'un tüm UI component'leri — web ve (ileride) React Native — tek bir Storybook instance'ında yaşar. Storybook'ta yeri olmayan hiçbir component projeye giremez.

## Nerede yaşar?

- Konum: [packages/ui](../packages/ui/)
- Config: [packages/ui/.storybook/](../packages/ui/.storybook/)
- Framework: `@storybook/react-vite` (v10)
- Minimum addon: `@storybook/addon-a11y` (diğer "essentials"/"interactions" v10'da core'a taşındı, ayrı paket gerekmez)

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

- `Primitives/*` — tek dokunuşluk UI (Button, Input, Badge…)
- `Composites/*` — birden fazla primitive'den oluşan component (Card, Dialog…)
- `UI Kit/*` — Untitled UI wrap'leri (ayrı issue #48)

React Native story'leri ileride `RN/*` prefix'i altında gelecek (ayrı issue #47).

## "Component var, story yok" durumu

Şu an CI'da sadece soft check planlanıyor (ayrı issue, follow-up). Kural kültür seviyesinde zorunlu:

- PR'da yeni bir `*.tsx` eklenmiş ama eşdeğer `*.stories.tsx` yoksa review'da block edilir.
- Mevcut component'e prop/variant eklenmişse story da güncellenir.
- Bu kural [CLAUDE.md](../CLAUDE.md) içinde "Storybook Rule (MANDATORY)" başlığı altındadır.

## Follow-up işler (bu issue kapsamı dışı)

| Konu                                         | Issue                     |
| -------------------------------------------- | ------------------------- |
| React Native / react-native-web desteği      | #47                       |
| Untitled UI component wrap'leri + story'leri | #48                       |
| CI soft/hard fail: UI değişti, story yok     | açılacak (sonraki sprint) |

## Sorun giderme

- **`storybook` komutu "Cannot find module"** → `pnpm install` çalıştırdın mı? Paketler `packages/ui`'nin devDeps'inde; workspace kurulumu zorunlu.
- **Story'de tip hatası** → `satisfies Meta<typeof Component>` kalıbını kullan; props inference'ı doğru çalışır.
- **a11y uyarıları takılıyor** → kasıtlı istisna varsa story'de `parameters.a11y.test = 'off'` kullan ve yorum yaz; default'u sessizce gevşetme.
