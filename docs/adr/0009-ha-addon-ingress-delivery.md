# ADR 0009 — HA Add-on + Ingress teslim kanalı

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-20
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [docs/ARCHITECTURE.md](../ARCHITECTURE.md), [docs/SECURITY.md](../SECURITY.md), [addon/README.md](../../addon/README.md)

## Bağlam

Glaon'un web uygulaması Home Assistant kullanıcılarına ulaşmak zorunda. HA kurulumu tipik olarak ev-içi bir cihazda (Raspberry Pi, NUC, VM) çalışıyor ve internet üzerinden açık değil. Kullanıcı ihtiyaçları:

- Tek tıkla erişim — kullanıcı HA panelinden Glaon'a girebilmeli, ayrı login formu görmemeli.
- Harici port açmama — güvenlik minded HA kullanıcıları reverse proxy kurmak zorunda kalmamalı.
- HA session ile entegre — zaten HA'ya giriş yaptıysa Glaon ayrıca istemiyor.
- Multi-arch destek — amd64, aarch64 temel olarak; armv7/armhf sonradan.
- Update yönetimi — kullanıcı HA Add-on Store'dan güncelleme alabilmeli.

Değerlendirilen teslim kanalları:

- **Standalone web app (Vercel/Netlify/self-host):** İnternetten erişim gerekiyor; kullanıcı kendi HA'sına tünel kurmak veya HA Cloud subscription almak zorunda. Add-on'un "harici port açmama" avantajı yok.
- **HACS (Home Assistant Community Store) custom panel:** HACS Lovelace ecosystem odaklı; frontend yüklemek mümkün ama lifecycle yönetimi HACS'ta sınırlı. Versiyon update'i custom.
- **HA Add-on (nginx ile statik serve) + Ingress:** Supervisor add-on container'ı Glaon web app'ini nginx üzerinden servis ediyor; HA'nın Ingress reverse proxy'si HA session cookie ile auth ediyor. Panel option ile HA UI içinde sidebar entrysi. Harici port yok.
- **HA Core frontend patch:** HA'yı fork etmek; upstream değişikliklerle sürekli merge savaşı. Reddedildi.

Ingress karakteristiği Glaon için uyumlu:

- Dinamik URL prefix (her request'te farklı olabilir) → asset'lerin relative path'le build edilmesi gerek (ADR 0002, `vite build --base=./`).
- HA kullanıcı session cookie Ingress tarafından yönetiliyor → add-on container ayrıca auth gereksinimi yok (panel için). Standalone auth akışı OAuth2 ile (ADR 0005) ayrı kurulum.
- iframe embed: HA panel add-on'u iframe ile gösteriyor → CSP `frame-ancestors` dikkatli ayarlanmalı. [docs/SECURITY.md](../SECURITY.md) `frame-ancestors 'none'` policy'si ile HA Ingress iframe davranışı issue #24'te davranış testi olarak değerlendirilecek.

## Karar

**Glaon web uygulamasının birincil teslim kanalı HA Add-on + Ingress'tir.**

- `addon/` klasörü HA Add-on manifest + Dockerfile + nginx config + bashio rootfs bootstrap içeriyor.
- Multi-arch: amd64, aarch64 ilk sürümde. armv7/armhf sonradan (#24).
- Ingress: `ingress: true` config flag, harici port açmaz.
- Panel: `panel_icon` + `panel_title` ile HA sidebar'a entry.
- Auth capability: `auth_api: true` (kullanıcı auth delegasyonu), `homeassistant_api: false`, `hassio_api: false` (minimum privilege).
- AppArmor: `apparmor: true`, `apparmor.txt` profili aktif (#24 kapsamında hardening).
- Build context: web app `vite build --base=./ --mode development` (şimdilik; production DSN gate'i #xx ile yeniden değerlendirilecek).
- CI: `.github/workflows/addon-build.yml` PR'da her arch için Docker image build'i (QEMU ile aarch64); `push: false` — image publish #24'te.

Standalone (Ingress dışı) web erişimi, mobile ve harici web kullanıcıları için OAuth2 akışı (ADR 0005) ile paralel sürecek. Add-on tek teslim kanalı değil — **birincil** teslim kanalı.

## Sonuçlar

### Olumlu

- Kullanıcı sıfır konfigürasyonla panel içinden erişiyor.
- Harici port açılmadığı için network güvenliği bozulmuyor.
- HA Add-on Store'a submission (#35) ile update akışı otomatikleşiyor.
- Multi-arch build CI'da doğrulanıyor; image hardening (non-root nginx, CSP compatibility) #24 kapsamında.
- Ingress tarafında HA session cookie sayesinde panel senaryosunda ek auth adımı yok.

### Olumsuz / ödenecek bedel

- Ingress'in dinamik URL prefix'i Vite build'inin `--base=./` ile relative yapılmasını zorunlu kılıyor — bazı asset patterns (preload, lazy-loaded chunk'lar) ek dikkat istiyor.
- iframe embed nedeniyle CSP `frame-ancestors` policy'si HA Ingress iframe davranışıyla test edilmeli (#24).
- CSP strict olunca bazı Untitled UI kit bileşenleri `unsafe-inline` style'lar için ek konfig isteyebilir — `style-src 'self' 'unsafe-inline'` zaten [docs/SECURITY.md](../SECURITY.md)'de tanımlı, hardening turu ile bu esneme daraltılacak.
- Add-on Docker image build süresi CI'da birkaç dakika alıyor (özellikle aarch64 QEMU ile); cache ile optimize edilecek.
- Release pipeline (#36/sonrası) Sentry DSN inject + SBOM + signing eklemek zorunda (ADR 0007 gate ile koordine).

### Etkileri

- [CLAUDE.md — Stack](../../CLAUDE.md#stack) "HA Add-on served over Ingress" teslim kanalı olarak dokümante.
- Vite build konfigürasyonu `--base=./` zorunlu → `build:addon` script'i ayrı.
- Nginx config HA Ingress için 8099 portunda, `docs/SECURITY.md`'deki CSP ve güvenlik başlıkları birebir.
- Add-on hardening (non-root nginx, AppArmor refinement, armv7 desteği, image publish, HA store submission) #24 ve #35'te takip ediliyor.

## Tekrar değerlendirme tetikleyicileri

- HA Supervisor Ingress API'sinde kırılma (dinamik prefix modelinde değişiklik) olursa.
- HA Add-on ekosistemi deprecate edilirse veya HACS gibi alternatif baskın olursa.
- Standalone web deployment (Vercel vs.) birincil kanal olarak öne geçerse (örneğin HA Cloud-only kullanıcılar).

## Referanslar

- [addon/README.md](../../addon/README.md)
- [docs/ARCHITECTURE.md](../ARCHITECTURE.md)
- [docs/SECURITY.md](../SECURITY.md)
- [HA Add-on config docs](https://developers.home-assistant.io/docs/add-ons/configuration)
- [HA Ingress docs](https://developers.home-assistant.io/docs/add-ons/presentation#ingress)
