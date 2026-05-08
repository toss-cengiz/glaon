# ADR 0024 — Lokal keşif: HA hostname'ine bağ kal, addon ayrı mDNS yayınlamaz

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-08
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [ADR 0009](0009-ha-addon-ingress-delivery.md), [ADR 0017](0017-dual-mode-auth.md), [docs/home-assistant-dev.md](../home-assistant-dev.md)

## Bağlam

Glaon'un local-mode UX'i kullanıcı evdeyken Home Assistant kurulumunu LAN üzerinden bulup OAuth2 PKCE akışına başlamaya dayalı (ADR 0017). Cloud-mode (kullanıcı evden uzakta) Glaon cloud relay'i üzerinden çalıştığı için lokal keşfe bağımlı değil — local-mode opportunistic'tir.

Lokal keşif için iki olası kanal var:

1. **HA Supervisor'ın varsayılan mDNS yayını.** HA OS / Supervisor varsayılan olarak host'u `<hostname>.local` (en yaygın hâli `homeassistant.local`) ve `_home-assistant._tcp` servis tipiyle Avahi/Bonjour üzerinden yayınlıyor. Bu yayın HA'nın var olma sebebi: mobile companion uygulaması, Lovelace setup wizard'ı, integration auto-discovery hep buna bel bağlıyor.
2. **Glaon addon'unun kendi mDNS yayını.** Addon container içinde `avahi-publish-service` (ya da pure-Node mDNS lib) ile `_glaon._tcp` servisini 8099 portu için yayınlamak. Bu, kullanıcının `glaon.local` gibi ayrı bir isim üzerinden erişmesini sağlar.

İki yolu da değerlendirdim. Yolun 2'sinin getirisi marjinal:

- Glaon'a `<ha-host>.local:8099` yerine `glaon.local` ile erişilmesi sadece kozmetik (kullanıcı HA panelinden zaten "Glaon" sidebar entry'siyle giriyor — Ingress URL'i hatırlamak zorunda değil).
- HA Supervisor zaten host'un `_home-assistant._tcp.local` advertisement'ını yapıyor — bu bilgi kullanıcının LAN'ında halihazırda mevcut. Glaon'un client'ları (web/mobile) HA'yı bu advertisement üzerinden bulabilir.
- Ek mDNS yayını AppArmor profil'inde (#351) yeni bir capability istiyor, addon image'ında `avahi` paket'ı ya da Node mDNS lib'i; saldırı yüzeyi ve image boyutu büyür.
- Addon `host_network: false` (`addon/config.yaml`) — Avahi'nin LAN-wide multicast yayını için `host_network: true`'ya geçmek izolasyon zayıflatır; alternatif `udev_kernel_module` permission yine ek attack surface.
- Yedi yıllık HA topluluk pratiği: addon'lar genelde kendi mDNS adlarını yayınlamıyor, "HA panelinden açın" yönlendirmesi standart. Glaon tablet/wall-display senaryosunda dahi kullanıcı tipik olarak HA'yı zaten kuruyor ve onun hostname'ini biliyor.

ADR 0017 §"Otomatik mod-detect"te "opportunistic `glaon.local` probe'u" geçiyordu; bu hedef ismi resimsel — gerçek probe `<ha-host>.local`'e veya kullanıcının manuel olarak girdiği HA URL'ine yapılır.

## Karar

**Glaon addon kendi mDNS servisini yayınlamaz.** Lokal keşif kanalı, HA Supervisor'ın halihazırda yaptığı `_home-assistant._tcp.local` mDNS advertisement'ıdır. Glaon clients (web mode-selector, mobile pairing wizard) bu hostname üzerinden HA'ya ulaşır; Glaon kendisi HA Ingress'i içinde yaşadığı için ayrı bir hostname'e gerek duymaz.

Operasyonel sonuçlar:

- `addon/config.yaml`: `host_network: false` korunur, mDNS-related permission talep edilmez.
- `addon/Dockerfile`: `avahi-utils`, `avahi-daemon`, ya da Node mDNS bağımlılığı eklenmez.
- `apps/web` mode-detect (#353), `apps/mobile` mode-detect (#356): probe hedefi `<ha-host>.local:8123` (kullanıcı tarafından girilen veya cloud'tan known-home ile gelen hostname). `glaon.local`'e probe yapılmaz.
- ADR 0017'deki "glaon.local probe" ifadesi semboliktir — bu ADR'le birlikte hedef "kullanıcının HA hostname'i" olarak okunur. ADR 0017 immutable; bu okuma ADR 0024'te kayıtlı.

İstemci tarafı mDNS resolution'ı bu issue'nun kapsamı dışı:

- **Web (Chrome/Firefox/Safari):** Tarayıcı `*.local` resolve eder (OS resolver — macOS Bonjour, Windows mDNSResponder, Linux nss-mdns/avahi). Web bunu yeniden uygulamaz; manual URL fallback'i mode-selector UI'sında zaten var (#353).
- **Mobile (iOS/Android):** ADR 0017 §"Local mode" kapsamında React Native Zeroconf modülü ile diskover edilir (#356); bu issue iskelet etmez, dökümanda referansla.
- **Tablet/Kiosk (HA panel içinden):** İçeriden Ingress üzerinden açılır — mDNS gereksiz.

## Sonuçlar

### Olumlu

- Sıfır kod, sıfır yeni runtime bağımlılığı, sıfır AppArmor değişikliği.
- HA topluluk pratiğine uygun: kullanıcı tek hostname (`<ha-host>.local`) hatırlar.
- Saldırı yüzeyi büyümüyor — `host_network: false` korunur (#351 hardening turunda da rahat).
- Document-only bir kararla #350 kapanır, ilerleyen iş bloklanmaz.

### Olumsuz / ödenecek bedel

- "glaon.local"in olmaması ilk-bakış UX'inde kullanıcıya HA hostname'ini sormak gerektiğini hatırlatır — pairing wizard ve mode-selector ekranlarında kullanıcı dostu örnek (`http://homeassistant.local:8123`) gösterilmesi gerekiyor. (#353/#356 acceptance criteria'da var.)
- Kullanıcı HA hostname'ini değiştirmişse (`config/configuration.yaml::homeassistant.name`) probe başarısız olur — fallback manual URL girişi UI'da gerekli (#353).

### Etkileri

- [docs/home-assistant-dev.md](../home-assistant-dev.md) "Lokal keşif" bölümüyle güncelleniyor — discovery matrix tablosu burada.
- [docs/devcontainer.md](../devcontainer.md): dev container içinde `*.local` resolve etmek için `extraHosts` ya da host network gerektiğine değinen bir not — pratikte `localhost:8123` kullanıyoruz, dev container etkilenmiyor.
- [#353](https://github.com/toss-cengiz/glaon/issues/353), [#356](https://github.com/toss-cengiz/glaon/issues/356) acceptance criteria'sında "manual URL fallback" zaten var; bu ADR'le tutarlı.

## Tekrar değerlendirme tetikleyicileri

- HA Supervisor'ın `_home-assistant._tcp` advertisement'ı kaldırılırsa (uzak ihtimal — HA'nın kendi mobile companion'u buna bağlı).
- Glaon, HA-bağımsız bir runtime moduna geçerse (örn. embedded broker olmadan tek başına lokal kontrol). Şu an plan dahilinde değil.
- Kullanıcılardan sürekli "Glaon URL'imi nerede bulurum" geri bildirimi gelirse — UX problemi olarak ele alınır, çözüm yine documentation/onboarding olur, ayrı bir mDNS yayını değil.

## Referanslar

- [HA Supervisor source — host hostname advertisement](https://github.com/home-assistant/supervisor)
- [Avahi service-types reference](https://avahi.org/service-types)
- [react-native-zeroconf](https://github.com/balthazar/react-native-zeroconf)
- [Bonjour & DNS-SD overview](https://datatracker.ietf.org/doc/html/rfc6763)
