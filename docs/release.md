# Sürüm ve Release Yönetimi

Glaon, Semantic Versioning (SemVer) takip eder ve release sürecini **release-please** aracıyla otomatikleştirir. Her release bir Git tag ve GitHub Release olarak işaretlenir.

## Versiyon politikası

`MAJOR.MINOR.PATCH` formatı:

- **MAJOR** — geri uyumsuz değişiklik (ör. OAuth2 akışı değişimi, `@glaon/core` public API kırılması, HA Add-on config şema değişimi).
- **MINOR** — geri uyumlu yeni özellik.
- **PATCH** — bug fix, küçük iyileştirme, güvenlik yaması.

Pre-1.0 döneminde (Phase 0–3) `0.x.y` kullanılır. `0.MINOR.PATCH` boyunca `feat:` commit'leri **MINOR** bump tetikler; `fix:` / `perf:` / `refactor:` **PATCH** tetikler. Breaking change (`feat!:` veya `BREAKING CHANGE:` footer) yine MAJOR bump'ı talep eder ama 1.0 öncesi MINOR'a düşürülür (release-please config: `bump-minor-pre-major: true`).

## Conventional Commits zorunlu

Her commit mesajı Conventional Commits formatında olmak zorunda. release-please CHANGELOG'u ve versiyon bump'ını commit tipinden üretir.

| Tip         | Anlam                                | Release etkisi                 |
| ----------- | ------------------------------------ | ------------------------------ |
| `feat:`     | Yeni özellik                         | MINOR bump                     |
| `fix:`      | Bug fix                              | PATCH bump                     |
| `perf:`     | Performans iyileştirmesi             | PATCH bump                     |
| `refactor:` | Davranış değiştirmeyen yeniden yazım | PATCH bump                     |
| `docs:`     | Dokümantasyon                        | CHANGELOG'da görünür, bump yok |
| `chore:`    | Kapsam dışı bakım                    | CHANGELOG'da görünür, bump yok |
| `test:`     | Test                                 | Gizli                          |
| `ci:`       | CI/CD                                | Gizli                          |
| `style:`    | Kod stil / formatlama                | Gizli                          |
| `build:`    | Build sistemi                        | Gizli                          |

**Breaking change:**

```
feat!: switch OAuth2 redirect URI format

BREAKING CHANGE: eski `/auth/cb` rotası kaldırıldı, yerine `/auth/callback` geldi.
```

CI (`conventional-commits` job), PR'daki her commit'i `@commitlint/config-conventional` kurallarına göre kontrol eder; uymuyorsa PR kırmızı.

## Release akışı

1. Feature PR'ları `development` branch'ine **Squash and merge** ile kapanır. Squash commit başlığı PR başlığından gelir — PR başlığı geçerli bir Conventional Commit olmak zorunda. Bkz. [docs/governance.md](governance.md#merge-method-policy).
2. Release zamanı geldiğinde `development → main` PR'ı açılır ve merge edilir. Bu merge'de de squash kullanılır; ama burada tek commit "chore(release): merge development" gibi olur — release-please zaten altındaki commit geçmişini (`development` üzerindeki orijinal conventional commit'ler) okur.
3. `main`'e düşen commit'ler `Release` workflow'unu (bkz. [`.github/workflows/release.yml`](../.github/workflows/release.yml)) tetikler.
4. release-please, son tag'dan beri biriken conventional commit'leri inceler ve bir **Release PR** açar (ör. `chore(main): release 0.1.0`). Bu PR:
   - Root `package.json` versiyonunu bump'lar.
   - `CHANGELOG.md`'yi oluşturur veya günceller.
   - `.release-please-manifest.json`'u günceller.
5. Release PR incelenip merge edildiğinde release-please otomatik olarak:
   - `vX.Y.Z` formatında annotated Git tag atar.
   - GitHub Release'i CHANGELOG içeriğiyle yayımlar.

Sen yalnızca Release PR'ı merge edersin; kalanı otomatik.

**Neden squash commit başlığı kritik:** `development → main` merge edildiğinde release-please, `main`'e düşen her commit'in başlığını `@commitlint/config-conventional` kurallarına göre parse eder. Squash title PR_TITLE (bkz. `scripts/apply-repo-settings.sh`) olduğu için PR başlıkları zaten commitlint'ten geçmiş olur; ama release PR'ını açarken de aynı disiplin geçerli. Başlık `feat:`/`fix:`/`perf:`/`refactor:` ile başlamıyorsa release-please o commit'i CHANGELOG'da göstermez ve versiyon bump'ı üretmez.

## Release artifact'leri — SBOM

Her GitHub Release, [SPDX JSON](https://spdx.github.io/spdx-spec/v2.3/SPDX-JSON/) formatında Software Bill of Materials dosyalarıyla birlikte yayınlanır. Release-please release'i yarattıktan sonra aynı workflow'ta iki follow-up job koşar ve çıktıları release asset olarak yükler.

### Hangi dosyalar ekli?

| Dosya                                | Kaynak                                   | Kapsam                                                                 |
| ------------------------------------ | ---------------------------------------- | ---------------------------------------------------------------------- |
| `glaon-sbom.spdx.json`               | syft, `path: .` ile workspace taraması   | Tüm `pnpm-lock.yaml` + `package.json` zinciri (apps + packages + root) |
| `glaon-addon-amd64-sbom.spdx.json`   | syft, build edilmiş add-on image üstünde | `amd64` add-on container'ı (base image + nginx + web bundle)           |
| `glaon-addon-aarch64-sbom.spdx.json` | syft, build edilmiş add-on image üstünde | `aarch64` add-on container'ı                                           |

Workspace SBOM: Node.js tarafındaki tüm doğrudan + transitive bağımlılıkları listeler. Mobile (Expo) build'i şu an kapsam dışı — mobile release pipeline ayrı bir iş ([#99](https://github.com/toss-cengiz/glaon/issues/99)'un "Scope — Out" notu).

Image SBOM (arch başına): HA add-on olarak dağıtılan container'ın her iki architecture'ı için ayrı üretilir. Base image (`ghcr.io/home-assistant/*-base:3.21`) içindeki alpine paketleri, çalışma zamanında yüklenen `nginx`, ve `COPY dist` ile gelen web asset'lerini kapsar.

### Nasıl indirir ve doğrularım?

Release sayfasından tek tek indirilir; komut satırından toplu indirme:

```bash
gh release download v0.1.0 \
  --pattern 'glaon-sbom.spdx.json' \
  --pattern 'glaon-addon-*-sbom.spdx.json'
```

Dosyalar SPDX 2.3 JSON spec'ine uyar; hızlı bir sanity check için:

```bash
jq '.spdxVersion, .name, (.packages | length)' glaon-sbom.spdx.json
# "SPDX-2.3"
# "glaon"  (veya repo adı)
# 450+     (workspace dep sayısı)
```

Vulnerability taraması için SBOM'u [grype](https://github.com/anchore/grype) gibi bir tool'a besleyebilirsin:

```bash
grype sbom:glaon-addon-amd64-sbom.spdx.json
```

### Şu an kapsam dışı — takip eden işler

- **Cosign / Sigstore imzalaması**: SBOM dosyaları henüz kriptografik olarak imzalanmıyor. [#99](https://github.com/toss-cengiz/glaon/issues/99)'un "Scope — Out" notu bu adımı bir sonraki güvenlik iterasyonuna bırakır. İmzalamadan sonra `glaon-sbom.spdx.json.sig` formatında ek asset'ler düşecek ve bu bölüm doğrulama komutuyla güncellenecek.
- **VEX attestation'ları**: Hangi CVE'lerin aslında Glaon'un runtime'ında exploit edilemediğini tanımlayan VEX belgeleri henüz üretilmiyor. Grype çıktısındaki false-positive'ler için yakın gelecekte planlı.
- **Mobile SBOM**: Expo prebuild + EAS build pipeline'ı mobile release issue'sunda ele alınacak; SBOM üretimi o akışa entegre edilir.

## Manuel tag — acil durum fallback

release-please çalışmadığı durumda (workflow bozuk, API limit, vb.) manuel tag:

```bash
git switch main && git pull
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
gh release create v0.1.0 --generate-notes
```

Manuel tag atıldıktan sonra `.release-please-manifest.json`'u elle güncellemek ve bir takip PR'ı açmak gerekir; aksi halde release-please bir sonraki çalıştığında versiyon çakışması yaratır.

## Paketlerin npm yayını

Bu aşamada **yok**. Tüm paketler `package.json` içinde `"private": true`. İlerde `@glaon/core` ayrı bir library olarak yayınlanırsa, bu strateji yeniden ele alınır ve Changesets gibi per-package versiyon aracı değerlendirilir.

## İlk release

`v0.1.0` Phase 0 sonunda planlı. O güne kadar `development`'ta commit'ler birikir; `development → main` merge'ü ilk Release PR'ını tetikleyecek.

### İlk release öncesi doğrulama checklist

İlk `development → main` merge'ünden önce workflow'un doğru kurulduğunu tek seferlik doğrulamak için:

1. **Workflow dosyası okunabilir olmalı** — `.github/workflows/release.yml` GitHub Actions `Release` tab'ında görünmeli (workflow "main dışında tetiklemez" olduğundan şu an görünmeyebilir; bu normal).
2. **Config + manifest sağlam** — `jq . release-please-config.json` ve `jq . .release-please-manifest.json` hata vermemeli; manifest `{ ".": "0.0.0" }` olmalı (henüz release yok).
3. **Conventional Commits zinciri** — `git log main..development --oneline | head -30` çıktısında commit başlıklarının `feat:`, `fix:`, `chore:`, `docs:`, `refactor:` vb. ile başladığını doğrula. `commitlint` zaten CI'da kontrol ediyor ama squash başlıkları ayrı kontrol noktası.
4. **Test merge** — ilk release için cesaret testi: küçük bir `fix:` veya `chore:` PR'ı `development` üzerinden `main`'e götürülüp release-please'nin Release PR açıp açmadığı izlenir. Release PR açılırsa workflow doğru çalışıyor demektir. Bu test PR'ı sonrasında release PR merge edilir ve ilk `v0.0.1` (veya `v0.1.0`) tag'i düşer.

**Not:** release-please ilk çalıştırmada tüm `main`'deki geçmiş conventional commit'leri parse eder. Eğer `main` üzerinde Phase 0 sırasında atılmış commit'lerden `feat:` varsa, ilk Release PR'ı `v0.1.0`'a atlar; yoksa `v0.0.1`'e. Bu noktayı kesin kontrol altında tutmak istersen `release-please-config.json`'a `bootstrap-sha` eklenebilir.

## Workflow action pinlemesi

[`.github/workflows/release.yml`](../.github/workflows/release.yml) içinde `googleapis/release-please-action` commit SHA'sına pinlenmiştir — sürüm etiketi (`@v4`) değil, SHA (`@5c625b...`). Bunun nedeni release pipeline'ının en yüksek yetkili workflow olması (tag atar, release yayınlar). SHA pin, action reposunun compromise olması durumunda bile yalnızca o sabit commit'i çalıştırır. Renovate SHA + `# v4.4.1` yorumunu okuyarak güncellemeleri otomatik PR olarak açar.
