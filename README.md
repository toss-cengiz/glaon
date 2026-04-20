# Glaon

Home Assistant üzerine kurulan güvenli, özel bir akıllı ev frontend'i. Web, duvar tableti ve mobil için tek kod tabanı.

## Nedir?

Glaon, Home Assistant'ın esnek arka ucunu kullanıcıya uyarlanmış, güvenliği ön planda tutan bir arayüzle sarar. HA'nın varsayılan Lovelace arayüzünün yerine geçer — aynı evdeki duvar tabletinde, telefonlarda ve masaüstü tarayıcıda tutarlı bir deneyim sunar.

## Teknoloji Yığını

| Katman   | Tercih                                       |
| -------- | -------------------------------------------- |
| Monorepo | Turborepo + pnpm workspaces                  |
| Web      | Vite + React + TypeScript (strict)           |
| Mobil    | Expo + React Native                          |
| Tablet   | Web uygulamasının kiosk modu                 |
| UI       | Untitled UI React kit (lisanslı)             |
| Backend  | Home Assistant (HA Add-on olarak paketlenir) |
| Auth     | OAuth2 Authorization Code + PKCE             |

## Dizin Yapısı

```
apps/
  web/      — Vite + React (tarayıcı + Ingress + tablet kiosk)
  mobile/   — Expo + React Native
packages/
  core/     — HA WebSocket istemcisi, OAuth2 PKCE, ortak tipler
  ui/       — Untitled UI sarmalayıcısı
  config/   — Paylaşılan ESLint / TypeScript konfigürasyonları
addon/      — Home Assistant Add-on (nginx + Ingress)
docs/       — Mimari, güvenlik, yol haritası (Türkçe)
```

## Geliştirme

```bash
# Node 22 LTS gerekir; .nvmrc dosyasındaki sürümü kullan.
corepack enable
pnpm install

# Tüm uygulamaları paralel başlat
pnpm dev

# Sadece web
pnpm --filter @glaon/web dev

# Sadece mobil
pnpm --filter @glaon/mobile dev

# Tip kontrolü + lint
pnpm type-check
pnpm lint
```

## Dokümantasyon

- [Mimari](docs/ARCHITECTURE.md)
- [Güvenlik](docs/SECURITY.md)
- [Yol Haritası](docs/ROADMAP.md)
- [HA Add-on](addon/README.md)

## Lisans

TBD. Untitled UI telif hakkı sahibine aittir ve bu depoya dahil değildir — ayrı olarak edinilmelidir.
