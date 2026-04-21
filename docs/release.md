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

1. Feature PR'ları `development` branch'ine merge olur.
2. Release zamanı geldiğinde `development → main` PR'ı açılır ve merge edilir.
3. `main`'e düşen commit'ler `Release` workflow'unu tetikler.
4. release-please, son tag'dan beri biriken commit'leri inceler ve bir **Release PR** açar (ör. `chore(main): release 0.1.0`). Bu PR:
   - `package.json` versiyonunu bump'lar.
   - `CHANGELOG.md`'yi günceller.
   - `.release-please-manifest.json`'u günceller.
5. Release PR incelenip merge edildiğinde release-please otomatik olarak:
   - `vX.Y.Z` formatında annotated Git tag atar.
   - GitHub Release'i CHANGELOG içeriğiyle yayımlar.

Sen yalnızca Release PR'ı merge edersin; kalanı otomatik.

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
