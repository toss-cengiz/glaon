# Bağımlılık yönetimi

Glaon'un npm paketlerini güncel ve güvenli tutan otomasyon katmanı. Amacı: "şu paket eski mi?" kontrolünü insan işi olmaktan çıkarmak ve güvenlik açıklıklarını geç değil, erken yakalamak.

## Aktörler

| Bileşen                                              | Ne yapar                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [Renovate](https://docs.renovatebot.com/)            | Haftalık outdated taraması + otomatik güncelleme PR'ları                                         |
| `pnpm audit --audit-level high`                      | CI'da her PR'da çalışır; high/critical açıklık bulursa build kırar                               |
| [`syncpack`](https://jamiemason.github.io/syncpack/) | Cross-workspace tek-versiyon politikası; PR'da drift varsa CI kırar                              |
| Dependency Review action                             | Her PR'da `pnpm-lock.yaml` diff'ini tarar — bkz. [governance](./governance.md#dependency-review) |
| GitHub Dependabot alerts                             | Repo-level UI uyarıları (user tarafından açılır)                                                 |

Aktörler birbiriyle çakışmaz — Dependabot alerts sadece sinyal üretir, düzeltmeyi Renovate yapar; `syncpack` cross-workspace tutarlılığı zorlar; audit ve dependency review CI'da son kontrol.

## Renovate iş akışı

### Dependency Dashboard

Renovate, repo'da her zaman açık tek bir "Dependency Dashboard" issue'su tutar. Tüm mevcut güncellemeler (auto-merge edilenler dahil) bu issue'da listelenir. Bu issue aynı zamanda Glaon'un "Issue-First Rule"u için bağımlılık güncellemelerinin resmi tracking issue'sudur — her Renovate PR'ı dashboard'u `Refs` ile işaret eder.

Nerede: repo Issues → `Dependency Dashboard` başlıklı, `dependencies` label'lı issue.

### Schedule

- **Düzenli** (patch + minor): her Pazartesi sabahı 09:00 (Europe/Istanbul) PR dalgası
- **Güvenlik**: schedule'dan bağımsız, `vulnerabilityAlerts` tetiklenir tetiklenmez
- **Lockfile bakımı**: haftalık, transitive semver-range içi güncellemeler için

### PR gruplandırması

Tekil paket başına bir PR yerine ekosistem bazlı gruplandırma:

- `storybook` — `storybook`, `@storybook/*`, `storybook-dark-mode`
- `react 19` — `react`, `react-dom`, `@types/react*`
- `react native + expo` — `react-native`, `react-native-web`, `expo*`
- `eslint` — `eslint*`, `@typescript-eslint/*`, `typescript-eslint`, `globals`
- `typescript`, `vite`, `chromatic`, `commit hooks`, `github actions`

Gruplandırılmayan paketler kendi PR'ları ile gelir.

### Auto-merge

| Tür                         | Karar                                         |
| --------------------------- | --------------------------------------------- |
| Patch (her paket)           | Auto-merge (CI yeşil şartıyla)                |
| Minor — devDeps             | Auto-merge (CI yeşil şartıyla)                |
| Minor — prod deps           | Manuel review                                 |
| Major                       | Dashboard onayı → PR → manuel review + merge  |
| Güvenlik (severity'ye göre) | PR açılır; auto-merge kuralları aynen geçerli |

"CI yeşil" = type-check · lint · audit + Chromatic + commitlint + gitleaks tümü pass. Branch protection auto-merge'ü engelliyorsa PR açık kalır.

## Review checklist (Renovate PR'ı geldiğinde)

Tipik patch PR'ı otomatik geçer, ama manuel olarak bakacağın bir PR geldiğinde:

1. **Release notes**: Renovate PR body'sinde "Release Notes" bölümünde ilgili changelog linki var mı? Bariz breaking change geçmişi var mı?
2. **CI durumu**: Tüm check'ler yeşil mi? Chromatic snapshot'larda değişiklik var mı (görsel regresyon riski)?
3. **Lock file**: `pnpm-lock.yaml` makul boyutta değişti mi? Beklenmedik transitive eklemeler?
4. **Monorepo etkisi**: Paket hangi workspace'te? Birden fazla etkiliyorsa `@glaon/core` → `@glaon/ui` → `apps/*` yönünde tutarlı mı?
5. **Prod vs dev**: `package.json`'da hangi bucket? Prod dep ise ekstra dikkat; devDep ise rahat.

## Major version bump'ları

Major'lar auto-PR açmaz — önce dashboard'da "approval needed" olarak durur. Karar anında:

1. Dashboard'da ilgili item'ın checkbox'ını tıkla → Renovate PR'ı açar.
2. PR body'sindeki release notes'u oku. Breaking change'leri listele.
3. Kod tarafında migration gerekliyse **aynı PR'a commit ekle**. Bu hâlâ Renovate PR'ı ama insan değişikliği de eklenebilir.
4. Type-check + lint + audit + Chromatic tümü yeşil olmadan merge etme. Chromatic'te unintended görsel değişiklik varsa migration tamam değil demektir.

## Cross-workspace tutarlılık (syncpack)

[syncpack](https://jamiemason.github.io/syncpack/) aynı paketin farklı workspace'lerde farklı versiyonlara kayma riskini kesiyor. Örnek: `@glaon/core` `react@19.2.5` kullanırken `@glaon/web`'in `react@19.3.0`'e geçmesi — CI drift olarak yakalar.

### Tetikleme

- Lokal: `pnpm syncpack:lint` — sadece rapor.
- Lokal fix: `pnpm syncpack:fix` — `fix-mismatches` (tüm workspace'leri aynı versiyona hizalar) + `set-semver-ranges` (range operatörünü politikaya uydurur).
- CI: her PR'da `verify` job'u içinde `pnpm syncpack:lint` koşar; drift varsa job fail olur.

### Politika (`.syncpackrc.json`)

- **Varsayılan range**: `^` — minör/patch güncellemeleri auto.
- **`@glaon/*` workspace ref'leri**: range yok (`workspace:*` pnpm protokolü).
- **Tek-versiyon zorlaması**: `prod`, `dev`, `overrides` dependency type'larında. `peerDependencies` policy dışında — peer'ler bilinçli geniş olabilir (ör. `@glaon/ui`'ın `react: ">=19"` peer'i).

### Bilinçli istisnalar (`versionGroups`)

Drift her zaman hata değil. İki bilinçli carve-out var:

1. **Expo ekosistemi** (`@glaon/mobile`) — `react`, `react-native`, `expo`, `expo-*`, `typescript`, `@types/react*` Expo SDK konvansiyonunu izler (exact pin veya `~`). Expo CLI bu versiyonları kendi SDK alignment'ı için yönetir; cross-workspace tek-versiyona zorlamak, Expo upgrade akışını kırar. Mobile Expo SDK güncellediğinde bu paketler kendi cadence'inde hareket eder.
2. **Vite hattı** — `@glaon/ui` Storybook'un `react-native-web-vite` gereği Vite 8 + `@vitejs/plugin-react` v6, `@glaon/web` ise stabil Vite 6 + plugin-react v4 kullanıyor. Storybook Vite 6'ya döndüğünde veya web Vite 8'e geçince tek-versiyona geçilir.

Her istisna `.syncpackrc.json` içinde `label` yorumuyla açıklanır — "neden ignored?" sorusu config'i okuyunca cevaplanmalı.

### Yeni istisna nasıl eklenir

1. Drift'in gerekçesi var mı? (SDK constraint, upstream runtime farkı, geçici migration penceresi — hepsi geçerli.)
2. `.syncpackrc.json`'da `versionGroups` listesine yeni bir entry ekle. `label` o gerekçeyi açık yaz — gelecekteki okuyan bizden birimizin kontrol'ünü kolaylaştırır.
3. Gerekliyse `semverGroups`'a da benzer bir carve-out (range politikası farklıysa).
4. `pnpm syncpack:lint` yerel yeşil olduktan sonra PR ile commit et.

Drift'e keyfi izin vermek yok — her istisna config'te gerekçeli.

## Rollback / pin

Bir paket yeni sürüm sonrası sorun çıkarırsa:

1. Hatalı versiyonu `package.json`'da sabit semver ile pin'le (`"foo": "1.2.3"`).
2. `renovate.json`'a `packageRules` entry'si ekle:
   ```jsonc
   { "matchPackageNames": ["foo"], "allowedVersions": "<1.3.0" }
   ```
3. Ayrı issue aç, kök sebebi araştır, hazır olunca constraint'i kaldır.

## Sorun giderme

- **Dashboard issue yok** → Renovate GitHub App repo'ya yüklü mü? Repo → Settings → Integrations.
- **PR'lar açılmıyor** → `prConcurrentLimit` veya `prHourlyLimit` dolmuş olabilir; dashboard'un "Pending" bölümüne bak.
- **Auto-merge gerçekleşmiyor** → Branch protection "Allow auto-merge" açık mı? Required status check'lerin tümü geçti mi? Renovate PR'ı her zaman commitlint'ten geçmeli (`:semanticCommits` preset'i bunu sağlıyor).
- **CI'da audit fail**, ama Renovate PR yok → Açıklık henüz Renovate'in advisory database'ine işlememiş olabilir; manuel bump + ayrı issue.
- **Schedule dışı PR bekleniyor** → Güvenlik uyarıları bypass eder. Manuel tetik için dashboard'da item'ı checkbox'la.

## User aksiyonları (tek seferlik)

1. [Mend Renovate GitHub App](https://github.com/marketplace/renovate) → Glaon repo'suna yükle.
2. Repo → Settings → **Security & analysis** → Dependabot alerts: **Enable** (ücretsiz).
3. Repo → Settings → **General** → "Allow auto-merge": **Enable**.
4. İlk Renovate çalışmasından sonra Dependency Dashboard issue'sunu kontrol et.

## Referanslar

- Renovate config: [renovate.json](../renovate.json)
- Syncpack config: [.syncpackrc.json](../.syncpackrc.json)
- CI audit + syncpack: [.github/workflows/ci.yml](../.github/workflows/ci.yml)
- İlgili issue: #57 (Renovate), #95 (syncpack).
