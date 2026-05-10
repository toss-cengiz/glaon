# Glaon Home Assistant Add-on

Glaon web uygulamasını Home Assistant **Ingress** üzerinden servis eder. Harici port açmaz; HA kullanıcıları panel üzerinden doğrudan erişir. Mimari ve güvenlik gerekçesi [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) ve [docs/SECURITY.md](../docs/SECURITY.md)'de.

## Yapı

| Dosya                                | Açıklama                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `config.yaml`                        | HA Add-on manifest: slug, ingress, panel, capability flag'leri.                                         |
| `build.yaml`                         | Multi-arch base image eşlemesi (`amd64`, `aarch64`).                                                    |
| `Dockerfile`                         | `BUILD_FROM` ARG alır, nginx kurar, built web dist'i `/var/www/glaon` altına kopyalar.                  |
| `apparmor.txt`                       | AppArmor profili (`apparmor: true` ile yüklenir). Refinement #24 kapsamında.                            |
| `rootfs/run.sh`                      | `with-contenv bashio` bootstrap — nginx'i foreground'da başlatır.                                       |
| `rootfs/etc/nginx/http.d/glaon.conf` | Ingress için 8099 portunda dinleyen server bloğu + `docs/SECURITY.md`'deki CSP ve hardening başlıkları. |

## Build context hazırlığı

Add-on image'ı `apps/web` üretimine dayanır. Root'ta:

```bash
pnpm build:addon
```

Bu komut:

1. `@glaon/web`'i `base='./'` ile build eder (HA Ingress değişken prefix'iyle çalışsın diye **relative asset path** zorunlu). Scaffold akışında build `--mode development` ile koşar — shippable release değil, Sentry DSN gate'i devrede değil. Gerçek release workflow'u ayrı issue'da Sentry DSN'i inject edecek.
2. `apps/web/dist`'i `addon/dist/`'e kopyalar. `addon/dist/` gitignored — commit edilmez.

## Lokal image build

`pnpm build:addon` sonrası (addon context hazır):

```bash
docker buildx build addon/ \
  --build-arg BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.21 \
  --platform linux/amd64 \
  --tag glaon-addon:local \
  --load
```

`aarch64` için `BUILD_FROM`'u `ghcr.io/home-assistant/aarch64-base:3.21` ve `--platform`'u `linux/arm64` yap. Cross-arch build için host'ta QEMU emulation açık olmalı (`docker buildx ls` → `linux/arm64` destekleniyor mu?).

## HA dev instance'da test (`ha su addons`)

Yerelde HA instance'ı varsa add-on'u local repo olarak yükleyebilirsin:

1. Bu repo'yu HA host'unun erişebildiği bir path'te bulundur (örn. Supervisor'ın `addons/local/` klasörü altında symlink, veya HA → Add-on Store → Repositories ile git URL).
2. Supervisor'ın add-on dizinine Glaon'u ekle:

   ```bash
   ha su addons reload
   ha su addons info local_glaon
   ```

3. Install + start:

   ```bash
   ha su addons install local_glaon
   ha su addons start local_glaon
   ```

4. HA UI → **Settings → Add-ons → Glaon → Open Web UI** (Ingress panel girişi).

Log akışı:

```bash
ha su addons logs local_glaon -f
```

## `apps/api` ile ilişki

Add-on yalnızca `apps/web` static bundle'ını servis eder. **`apps/api` add-on içinde paketlenmez** — [ADR 0026](../docs/adr/0026-apps-api-delivery-hosted.md) `apps/api`'ı Glaon-managed hosted service olarak konumlandırdı. Mongo Atlas + container hosting Glaon ekibi tarafından işletilir; add-on kullanıcısı sadece HA Ingress üzerinden web'i açar, web ise cross-origin HTTPS ile `https://api.glaon.app` (deploy pipeline kararına göre) endpoint'ine bağlanır.

Sonuç:

- Add-on Dockerfile'ı **sadece** nginx + dist içerir; `node`, `mongo`, `apps/api` artefaktı yoktur.
- Add-on güncellendiğinde Mongo şeması ya da apps/api endpoint contract'ı zorunluluk değil — ikisi bağımsız deploy döngülerine sahip.
- Self-host (sidecar) modeli **şimdilik kapsam dışı**; Phase 5'te ayrı ADR ile yeniden değerlendirilir.

Detaylar: [docs/api.md](../docs/api.md).

## Güvenlik kontrolleri

- `ingress: true` — harici port açmaz; erişim sadece HA Ingress üzerinden.
- `host_network: false` — container izole.
- `homeassistant_api: false`, `hassio_api: false` — add-on Core ve Supervisor REST API'lerine erişmez (OAuth2 akışı `auth_api: true` ile ayrı).
- `auth_api: true` — HA kullanıcı auth'una delegasyon; token yönetimi uygulama içinde değil.
- `apparmor: true` — `apparmor.txt` profili aktif.
- nginx CSP `docs/SECURITY.md` ile birebir. `frame-ancestors 'none'` → clickjacking blok; HA Ingress iframe embed'i bu politika altında davranış testi #24'te değerlendirilecek.

## Follow-up işler (bu issue kapsamı dışı)

| Konu                                                | Issue |
| --------------------------------------------------- | ----- |
| Multi-arch registry publish + image hardening       | #24   |
| AppArmor profili refinement (non-root nginx, vs.)   | #24   |
| HA Add-on store submission + logo/icon              | #35   |
| `armv7` / `armhf` arch desteği (şu an CI kapsamsız) | #24   |
