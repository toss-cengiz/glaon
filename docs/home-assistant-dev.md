# Lokal Home Assistant Dev Fixture

Glaon'un Phase 2 işleri (OAuth2 PKCE, WebSocket client, service çağrıları, entity state) gerçek bir Home Assistant instance'ına karşı geliştirilir. Bu döküman, monorepo'nun parçası olan **`apps/dev-ha/`** docker compose fixture'ını anlatır — clone'dan ilk authenticated WebSocket bağlantısına kadar tüm akış burada.

> Bu fixture **sadece dev** içindir. CI'da E2E testleri ([#13](https://github.com/toss-cengiz/glaon/issues/13), [#358](https://github.com/toss-cengiz/glaon/issues/358), [#359](https://github.com/toss-cengiz/glaon/issues/359)) Playwright `page.route()` ile mock'larla çalışır; gerçek HA çağırmaz.

## Önkoşullar

- Docker Desktop / Engine 24+ (`docker compose` plugin'i dahil).
- 8123 portu boş.
- Repo'ya pnpm 9 ile bağlı, `pnpm install` koşulmuş.

## Hızlı başlangıç

```bash
pnpm ha:up      # docker compose up -d, container 'glaon-dev-ha' adıyla
pnpm ha:logs    # canlı stdout (Ctrl+C ile çık)
pnpm ha:down    # durdur, config korunur
pnpm ha:reset   # durdur + onboarding'i sıfırla (configuration.yaml kalır)
```

İlk açılışta HA, `http://localhost:8123` üzerinde **onboarding wizard**'ını gösterir — bir kerelik manuel adım. Ayrıntılar aşağıda.

## İlk açılış: onboarding

1. `pnpm ha:up`'ı çalıştır, ardından container'ın hazır olmasını bekle:
   ```bash
   docker compose -f apps/dev-ha/docker-compose.yml ps
   # STATUS sütununda "(healthy)" görmelisin (~30s)
   ```
2. Tarayıcıda `http://localhost:8123`'e git.
3. Sihirbaz adımları:
   - **Hesap oluştur** — kullanıcı adı + şifre. Geliştirici makinesinde dev için `glaon-dev` / `glaon-dev` yeter; bu instance dış ağa açık değil.
   - **Lokasyon** — varsayılanı geç.
   - **Cihaz keşfi** — _Skip_'le; `demo:` platformu zaten örnek entity sağlıyor.
   - **Analytics** — kapat (dev fixture'ı telemetri göndermesin).
4. Sihirbaz biter, ana ekranda `demo:` platformundan ~30 entity görürsün (light, switch, climate, cover, media_player).

Yeni kullanıcı `apps/dev-ha/config/.storage/auth` altında saklanır; `pnpm ha:down` ile kaybolmaz, `pnpm ha:reset` ile sıfırlanır.

## OAuth2 client_id ve CORS

HA, OAuth2 PKCE akışında `client_id` olarak **redirect_uri ile aynı host'u işaret eden bir URL** kabul eder (CLAUDE.md HA Notes). Glaon'un dev origin'leri `apps/dev-ha/config/configuration.yaml`'da CORS whitelist'inde tanımlı:

| Origin                   | Kim kullanır               |
| ------------------------ | -------------------------- |
| `http://localhost:5173`  | `apps/web` Vite dev server |
| `http://localhost:6006`  | `packages/ui` Storybook    |
| `http://localhost:8081`  | `apps/mobile` Expo Metro   |
| `http://localhost:19006` | `apps/mobile` Expo Web     |

Yeni bir dev origin eklenecekse `configuration.yaml`'ı güncelle, `pnpm ha:down && pnpm ha:up` ile yeniden başlat.

OAuth flow'unu manuel test etmek için (örn. token refresh debug):

```
GET http://localhost:8123/auth/authorize
  ?client_id=http%3A%2F%2Flocalhost%3A5173%2F
  &redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fauth%2Fcallback
  &state=<random>
  &code_challenge=<S256(verifier)>
  &code_challenge_method=S256
```

Onay verince HA, `code` ile redirect'ler. Token exchange:

```bash
curl -X POST http://localhost:8123/auth/token \
  -d 'grant_type=authorization_code' \
  -d 'code=<code>' \
  -d 'client_id=http://localhost:5173/' \
  -d 'code_verifier=<verifier>'
```

## Long-lived access token (LLAT) — debug only

Phase 2 LLAT'ı **Glaon clients için yasakladı** (ADR 0005); ancak ad-hoc curl / `wscat` smoke testleri için işine yarayabilir.

1. `http://localhost:8123/profile` → **Long-Lived Access Tokens** bölümüne git.
2. **Create Token** → ad ver (`glaon-dev-curl` gibi) → tokeni güvenli bir yere kopyala (HA bunu bir daha göstermez).
3. WS smoke:
   ```bash
   wscat -c ws://localhost:8123/api/websocket
   # > {"type":"auth","access_token":"<token>"}
   # < {"type":"auth_ok","ha_version":"..."}
   # > {"id":1,"type":"get_states"}
   ```

LLAT'ı **Glaon source code'una koyma**. `.env` dosyana, `~/.config/glaon-dev/token` gibi gitignored bir yere ya da terminal session'ına `export` et.

## Sıfırlama

```bash
pnpm ha:reset
```

Bu komut:

1. Container'ı durdurur (`docker compose down`).
2. `apps/dev-ha/config/` altında `configuration.yaml` ve `.gitignore` dışındaki **her şeyi** siler — `.storage/`, sqlite DB'leri (`home-assistant_v2.db*`), log'lar, `deps/`, `tts/`, `.cloud/`, üretilmiş YAML'lar.
3. Sonraki `pnpm ha:up` taze onboarding'le açılır.

`configuration.yaml`'ı düzenleyip değişiklik denemek istiyorsan reset'e gerek yok — `pnpm ha:down && pnpm ha:up` yeter (HA configuration.yaml'ı her başlangıçta yeniden okur).

## Sorun giderme

| Belirti                                             | Çözüm                                                                                                                                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm ha:up` "port already in use" der              | 8123 başka bir process tarafından tutuluyor. `lsof -i :8123` ile bul; çoğunlukla başka bir HA container'ı (`docker ps`).                                                      |
| Healthcheck "(starting)" sonra "(unhealthy)" oluyor | İlk açılışta HA backend'i kuruyor (~45s). 2 dakika geçmesine rağmen "unhealthy" kalırsa `pnpm ha:logs` ile error mesajına bak; çoğunlukla `configuration.yaml` syntax hatası. |
| Web/mobile login `CORS` hatası verir                | Origin'i `apps/dev-ha/config/configuration.yaml` `cors_allowed_origins` listesine ekle, restart et.                                                                           |
| Login sonrası WS `auth_invalid` döner               | Token süresi dolmuştur ya da farklı bir HA instance'a aittir. `pnpm ha:reset` + yeniden onboarding hızlı çözüm.                                                               |
| `docker compose` "permission denied" der (Linux)    | Kullanıcını `docker` grubuna ekle: `sudo usermod -aG docker $USER`, oturumu kapat/aç.                                                                                         |
| HA container loglarında "Database is locked"        | Önceki ungraceful shutdown bozuk DB bıraktı. `pnpm ha:reset` ile sıfırla.                                                                                                     |

## Image güncellemesi

`docker-compose.yml`'daki HA image'ı **digest-pin'li**. [Renovate](dependencies.md) bu dijesti haftalık tarar — yeni `stable` çıkınca otomatik PR açar. Manuel bump istiyorsan:

```bash
docker buildx imagetools inspect ghcr.io/home-assistant/home-assistant:stable
```

ve çıktıdaki **index digest**'i (`sha256:...`) `docker-compose.yml`'daki `image:` alanına yapıştır. Multi-arch index digest'i kullan; tek-platform digest'i koyarsan farklı CPU mimarilerinde container çekilemez.

## İlişkili işler

- [#331](https://github.com/toss-cengiz/glaon/issues/331) — bu fixture'ın açılış issue'su.
- [#7](https://github.com/toss-cengiz/glaon/issues/7), [#8](https://github.com/toss-cengiz/glaon/issues/8), [#10](https://github.com/toss-cengiz/glaon/issues/10), [#13](https://github.com/toss-cengiz/glaon/issues/13) — fixture'ı tüketen Phase 2 implementation'ları.
- [docs/devcontainer.md](devcontainer.md) — Dev Container kullanıyorsan, container `docker-outside-of-docker` özellikli; aynı `pnpm ha:*` komutları içeriden de çalışır.
