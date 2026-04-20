# Glaon Home Assistant Add-on

Glaon web uygulamasını Home Assistant Ingress üzerinden servis eder. Dokümantasyon [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) dosyasında.

## Build

`apps/web` üretimi `dist/` dizinine kopyalandıktan sonra:

```bash
docker build --build-arg BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest -t glaon-addon .
```

## Notlar

- `auth_api: true` aktif — add-on, HA OAuth2 uçları için kullanıcı bilgilerini sorgulayabilir.
- `ingress: true` — add-on sadece Ingress üzerinden erişilebilir, harici port açmaz.
- AppArmor profili `apparmor.txt` içinde.
