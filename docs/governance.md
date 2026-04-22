# Governance — yönetişim

Glaon'un hangi kuralı neyin koruduğunu, kuralı kimin nasıl değiştireceğini ve bir kuralı bozmak istediğinde hangi yolu izleyeceğini bir arada tutan tek sayfa.

## Neden bu sayfa var?

CLAUDE.md, geliştirme sırasında uygulanan davranış kurallarını anlatır (Issue-First, Branching, PR Scope & Test Plan Sync, vb.). Bu doküman ise o kuralları **GitHub'da makineye öğretilen** tarafla — branch protection ruleset'leri, CODEOWNERS, PR template — eşler. İkisi birlikte: CLAUDE.md = insan kuralı, buradaki config'ler = GitHub'ın otomatik zorlaması.

## Korunan branch'ler

Repo'nun iki özel branch'i var:

| Branch        | Ne için                                      | Koruma seviyesi                                                      |
| ------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `development` | Entegrasyon branch'i; feature PR'ları buraya | PR zorunlu · linear history · required status checks · no force-push |
| `main`        | Release branch'i; sadece release-please PR'ı | PR zorunlu · linear history · required status checks · no force-push |

Direkt push her iki branch'te de kapalı. Değişiklik **her zaman** PR üzerinden gider.

Tam konfigürasyon config-as-code olarak JSON'da tutulur:

- [`.github/rulesets/development.json`](../.github/rulesets/development.json)
- [`.github/rulesets/main.json`](../.github/rulesets/main.json)

## Merge method policy

Development ruleset'i `required_linear_history: true` zorladığı için merge-commit (yani `Create a merge commit` seçeneği) kullanılamaz. Repo ayarları bunu destekleyecek şekilde kilitlenmiştir:

| Ayar                 | Değer              | Neden                                                                    |
| -------------------- | ------------------ | ------------------------------------------------------------------------ |
| `allow_squash_merge` | `true` _(default)_ | Standart akış: her PR development'a tek commit olarak düşer.             |
| `allow_rebase_merge` | `true`             | Zaten tek commit olan, conventional-commit başlığı doğru PR'lar için.    |
| `allow_merge_commit` | `false`            | `required_linear_history` ile çakışıyordu; hem UI hem ruleset kapatıyor. |

Squash commit formatı:

- **Title:** `PR_TITLE` — PR başlığı commit başlığı olur.
- **Body:** `PR_BODY` — PR body'si commit gövdesine kopyalanır.

Bu format release-please için kritik: `development → main` akışında release-please merge edilmiş commit'leri okuyarak versiyon bump'ı ve CHANGELOG'u üretir. Squash commit başlığı geçerli bir Conventional Commit (`feat:`, `fix:`, `refactor!:`, vb.) değilse release-please o PR'ı atlar. PR başlığını bu yüzden `commitlint` formatında tutuyoruz.

Pratik sonuç:

- PR UI'ında yalnızca **Squash and merge** ve **Rebase and merge** seçenekleri görünür. Merge-commit butonu gri.
- Feature PR'ları varsayılan olarak **Squash and merge** ile kapanır.
- Rebase yalnızca PR zaten tek commit ise ve o commit'in başlığı tam olarak istenen commit başlığı ise mantıklı.

Bu ayarlar Web UI'dan `Settings → General → Merge button` sayfası üzerinden de görülebilir; ama tek gerçeklik kaynağı [`scripts/apply-repo-settings.sh`](../scripts/apply-repo-settings.sh) script'idir. UI'dan elle değişiklik yapma — bir sonraki script çalışmasında ezilir.

## Required status checks

Development'a merge olacak her PR'ın aşağıdaki check'leri yeşil olmalı:

- `type-check · lint · audit` — TS + ESLint + `pnpm audit --audit-level high`
- `conventional-commits` — commitlint, PR commit'leri için
- `gitleaks` — secret tarama
- `visual regression` — Chromatic

`main`'deki liste aynı, sadece `conventional-commits` yok (main'e sadece release-please PR'ı ulaşır; commitlint PR-only event'lerde koşar, main direct push zaten yasak).

Yeni bir required check eklemek istersen:

1. CI workflow'unda job adını kesinleştir (bu ad ruleset'te `"context"` olur).
2. İlgili JSON'daki `required_status_checks` listesine `{ "context": "<job adı>" }` ekle.
3. `scripts/apply-rulesets.sh` çalıştır.
4. Değişikliği PR ile commit et — UI'den değil.

## CODEOWNERS

[`.github/CODEOWNERS`](../.github/CODEOWNERS) her dosya path'ini en az bir sahibe bağlar. Tek maintainer (`@toss-cengiz`) olduğu için pratik etkisi henüz yok ama yapı hazır — yeni bir katılımcı geldiğinde path-based owner ataması tek commit.

Ruleset'te `require_code_owner_review` şu an `false`. Ekip genişlediğinde `true`'ya alınır + `required_approving_review_count` yükseltilir.

## PR template

[`.github/pull_request_template.md`](../.github/pull_request_template.md) `gh pr create` çağrılırken otomatik yüklenir (body verilmezse). Yapı sabit: **Summary / Scope (In-Out) / Test plan / User action / Closes #N**.

Bu şekil CLAUDE.md'deki "PR Scope & Test Plan Sync" mandatory kuralının pratik karşılığı — her PR aynı formatı taşır, reviewer ne olduğunu tek bakışta okur.

## Bir kuralı değiştirme

**UI'dan değiştirme.** GitHub → Settings'ten manuel edit kayıp bırakır: sonraki `apply-rulesets.sh` çalışması UI değişikliğini ezer.

Doğru akış:

1. İlgili JSON veya markdown dosyasını düzenle.
2. PR aç (Issue-First Rule + bu dosyadaki branching kuralı geçerli).
3. Merge sonrası `scripts/apply-rulesets.sh` çalıştır — idempotent.

## İlk apply (one-time kullanıcı aksiyonu)

İki script var, ikisi de idempotent ve admin:repo scope'lu bir token gerektirir:

```bash
gh auth login --scopes "repo,admin:repo_hook,admin:org,admin:public_key"
# veya mevcut token'a admin:repo scope'u ekle

scripts/apply-rulesets.sh       # branch protection ruleset'leri
scripts/apply-repo-settings.sh  # merge method ayarları
```

`apply-rulesets.sh` çıktısı:

```
Applying ruleset: development-protection
  → created
Applying ruleset: main-protection
  → created

Done. Current rulesets on toss-cengiz/glaon:
  - development-protection (active)
  - main-protection (active)
```

Sonraki çalıştırmalar `created` yerine `updated` yazar.

`apply-repo-settings.sh` çıktısı:

```
Applying repo merge-method settings...
  allow_squash_merge:  true
  allow_rebase_merge:  true
  allow_merge_commit:  false
  squash_title:        PR_TITLE
  squash_body:         PR_BODY
Done.
```

## Bypass

`bypass_actors` her iki ruleset'te boş. Bu bilinçli: branch protection kuralı insan için olduğu kadar Claude için de. Bir agent'ın veya bot'un kuralı geçmesi gerekiyorsa, o ihtiyaç kendi başına bir issue olur; körü körüne bypass eklenmez.

## Referanslar

- CLAUDE.md: repo'nun davranış kuralları.
- [GitHub Rulesets API](https://docs.github.com/en/rest/repos/rules) — ruleset schema'sı.
- [CODEOWNERS syntax](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).
- İlgili issue: #69 (initial setup), #75 (merge method policy).
