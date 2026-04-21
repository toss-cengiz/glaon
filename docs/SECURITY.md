# Güvenlik

Glaon'da güvenlik ertelenebilir bir özellik değildir; her fazda paralel olarak işlenir.

## Tehdit Modeli (özet)

| Tehdit                      | Saldırı vektörü                          | Azaltma                                                                                   |
| --------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Token sızdırma              | XSS, `localStorage` sıyrılması           | Token'ı `localStorage`'ta tutma; web'de in-memory + `httpOnly` çerez; mobilde SecureStore |
| CSRF                        | HA oturum çerezine karşı cross-site post | `frame-ancestors 'none'`, `SameSite=Strict` çerez, OAuth2 `state`                         |
| Ortadaki adam               | TLS kesme                                | HSTS, Expo'da certificate pinning, HA'nın kendi sertifikasını doğrulama                   |
| Tedarik zinciri             | Kötü amaçlı paket                        | Pinned versiyonlar, Renovate + onay gereksinimi, `pnpm audit` CI'da                       |
| Add-on privilege escalation | Container escape                         | `host_network: false`, AppArmor profili, `homeassistant_api: false`                       |

## Kimlik Doğrulama

- Yalnızca **OAuth2 Authorization Code + PKCE** kullanılır. Long-Lived Access Token (LLAT) uygulama içinde üretilmez.
- `state` her istek için yenilenir ve tek seferlik kullanılır.
- `refresh_token` yalnızca güvenli depolamadadır; belleğe yazılırken hızlıca kullanılıp silinir.
- Parola, PIN veya biyometri Faz 3'te ek katman olarak gelebilir (uygulama kilidi).

## Transport

- Tüm istekler TLS zorunludur; HTTP yönlendirmeleri kod yolu olarak yok.
- HSTS add-on tarafında aktif (`Strict-Transport-Security`).
- Mobile tarafında sertifika pinning (`expo-dev-client` üzerinden veya native katmanda) — Faz 3 işi.

## İçerik Güvenliği

- `Content-Security-Policy`: `default-src 'self'`, `connect-src 'self' wss: https:`, `script-src 'self'`, `frame-ancestors 'none'`.
- HTML'de inline script yok; `nonce` kullanılmıyor çünkü derlenmiş bundle statik.
- Kullanıcı üretimi içerik (otomasyon adları, cihaz takma adları) render öncesi React tarafından kaçırılır; `dangerouslySetInnerHTML` **yasak**.

## Sırlar

- `.env` dosyaları commit edilmez; yalnızca `.env.example` paylaşılır.
- CI sırrı: yalnızca GitHub OIDC veya environment secret.
- `gitleaks` iki katmanda çalışır: CI job'u (`gitleaks-action`) her PR'ı tarar; lokal pre-commit hook (`.husky/pre-commit`) staged diff'i commit olmadan önce tarar. Kurulum ve hata giderme aşağıda.

### Lokal gitleaks kurulumu

Pre-commit hook'un çalışması için `gitleaks` binary'si lokalde kurulu olmalı. Kurulu değilse `git commit` hata verir ve hook devreye girmez.

Kurulum:

- **macOS (Homebrew):** `brew install gitleaks`
- **Linux (Go toolchain):** `go install github.com/gitleaks/gitleaks/v8@latest`
- **Diğer:** <https://github.com/gitleaks/gitleaks/releases> üzerinden binary indir, `PATH`'e ekle.

Doğrulama: `gitleaks version` → 8.x çıktısı görünmeli.

Config: Repo kökündeki `.gitleaks.toml` default rule set'i miras alır. Yeni kural veya allowlist eklemek için `[extend]` bloğunun altına kural ekle — her değişiklik ayrı bir issue + PR ile gelir.

### Hook sızıntı yakaladığında

1. Çıktıda `Finding` ve redact edilmiş eşleşme gösterilir (gerçek sır log'a düşmez).
2. **Gerçek sır ise:** staged dosyadan çıkar, secret'ı döndür (provider panelinde revoke + rotate), `.env`'e taşı, yeniden stage + commit et.
3. **False positive ise:** `.gitleaks.toml`'e `[allowlist]` bloğu eklenmesi için ayrı bir PR aç (kuralı gevşetmeden önce gerekçe yorumu zorunlu). Tek seferlik bypass için commit'in ilgili satırına `# gitleaks:allow` yorumu eklenebilir; bunu istismar etmeyin.
4. `--no-verify` ile hook'u atlamak yasaktır — incident bırakmadan çözüm.

## Bağımlılıklar

- `pnpm audit --prod` CI'da kırar.
- Renovate `automerge: false` ile PR açar; güvenlik güncellemeleri hızlı yol alır.
- Versiyonlar range değil exact — `^` / `~` kullanımı `peerDependencies` dışında kaçınılır (devDeps için tolerans var).

## HA Add-on

- `ingress: true`, `host_network: false`, `auth_api: true` (gerekli minimum), `homeassistant_api: false`.
- `AppArmor` profili dahildir.
- Add-on container'ı root dışında bir kullanıcı ile çalıştırmak için sonraki fazda `nginx` konfigürasyonu revize edilecek.

## PR Süreci

- Her feature PR'ında `security-review` skill çalıştırılır.
- Auth, crypto, network veya storage dokunan değişiklikler iki gözlü review gerektirir.
- OWASP Top 10 ve Mobile OWASP Top 10 kontrol listeleri `docs/` altında tutulacak.
