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

Tek komutla reproducible ortam için [Dev Container](docs/devcontainer.md) kullanabilirsin — VS Code'da "Reopen in Container" yeterli.

### İlk kurulum (sıfırdan)

```bash
# Node 22 LTS gerekir; .nvmrc dosyasındaki sürümü kullan.
corepack enable
pnpm install

# apps/api .env'ini hazırla ve SESSION_JWT_SECRET üret (idempotent).
pnpm dev:bootstrap

# apps/api'nin bağımlısı olan MongoDB konteynerini başlat.
pnpm dev:mongo:up

# (Opsiyonel) Lokal Home Assistant dev fixture — Phase 2 OAuth/WS/
# servis çağrılarını lokalde çalıştırmak için.
pnpm ha:up

# Tüm uygulamaları paralel başlat.
pnpm dev
```

`pnpm dev:bootstrap` yalnızca eksik olanı oluşturur; ikinci çağrı no-op'tur. `SESSION_JWT_SECRET` boşsa `openssl rand -hex 32` ile üretilir.

### Günlük kullanım

```bash
# Sadece web
pnpm --filter @glaon/web dev

# Sadece mobil
pnpm --filter @glaon/mobile dev

# Tip kontrolü + lint
pnpm type-check
pnpm lint

# MongoDB'yi durdur (disk alanı için temizlik)
pnpm dev:mongo:down
```

apps/api başlangıçta `MONGODB_URI is required` veya `SESSION_JWT_SECRET must be at least 32 bytes` gibi bir hata yazdırırsa, sıfırdan kurulum adımlarındaki `pnpm dev:bootstrap` adımı atlanmış demektir — onu çalıştırıp `pnpm dev`'i yeniden başlat.

## Dokümantasyon

- [Mimari](docs/ARCHITECTURE.md)
- [Güvenlik](docs/SECURITY.md)
- [Yol Haritası](docs/ROADMAP.md)
- [Dev Container](docs/devcontainer.md)
- [Lokal Home Assistant Dev Fixture](docs/home-assistant-dev.md)
- [HA Add-on](addon/README.md)

## Lisans

TBD. Untitled UI telif hakkı sahibine aittir ve bu depoya dahil değildir — ayrı olarak edinilmelidir.
