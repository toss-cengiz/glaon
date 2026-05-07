# ADR 0019 — Identity provider: Clerk (cloud mod için)

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-07
- **Karar verenler:** @cengizdoyran
- **İlgili konular:** issue #339 (this ADR), issue #344 (B2 — home registry + Clerk JWT guard), issue #352 (E1 — web Clerk SDK), issue #355 (G1 — mobile Clerk SDK), [ADR 0017 — dual-mode auth](0017-dual-mode-auth.md), [ADR 0018 — cloud relay topology](0018-cloud-relay-topology.md), [ADR 0009 — HA Add-on + Ingress](0009-ha-addon-ingress-delivery.md)

## Bağlam

[ADR 0017](0017-dual-mode-auth.md) cloud-mod için bir IdP (identity provider) gerekliliğini belirledi: kullanıcı Glaon ürününe (HA hesabından bağımsız) bir Glaon-tarafı kimlikle login olmalı, bu kimlikle cloud relay'i otorize etmeli. ADR 0017 IdP-agnostik bir tip katmanı (`AuthMode.cloud.session: CloudSession`) kurdu; bu ADR somut IdP'yi seçiyor.

Tartışma çerçevesi:

- **Frontend SDK kalitesi:** Web (React 19 strict, Vite SPA, [ADR 0002](0002-vite-react-19-web.md)) ve mobile (Expo SDK 54, RN 0.81, new architecture, [ADR 0003](0003-expo-new-architecture-mobile.md)) ikisinde de turn-key SDK olmalı; yoksa "ürün-dışı" işe ekibi sokar.
- **Cloud backend ergonomisi:** Cloud backend (apps/cloud, B-track) IdP token'larını verify etmeli. JWKS ile JWT verify pratik; ek SDK overhead'i istemiyoruz. Hosting [ADR 0020](https://github.com/toss-cengiz/glaon/issues/340)'de seçiliyor (Cloudflare Workers); SDK Workers runtime ile uyumlu olmalı.
- **Identity feature gereksinimleri:** Email + password (zorunlu), MFA (gelecek için zorunlu), social login (Google, Apple — özellikle iOS App Store gereksinimi), magic link (UX bonus).
- **GDPR + data residency:** AB kullanıcıları olabilir; IdP en azından EU region'da data hosting sunmalı veya processor agreement opt-in.
- **Cost @ N users:** Self-host yapılırsa ops yükü vs. SaaS abonelik. Lansman aşamasında 10-1000 user; sonraki yıl 10k beklentisi.
- **Vendor lock-in:** IdP migration ileride yapılırsa user re-onboarding nasıl olur? Migration story'si net mi?
- **Lansman zamanlaması:** Phase 2 cloud track sıkı. SaaS pick lansmanı 2-3 hafta öne alır; self-host 4+ hafta ekler.

Göz önünde bulundurulan alternatifler:

| IdP                                         | React + Expo SDK    | JWT verify  | MFA    | Cost @ 1k MAU           | EU region           | Self-host     | Karar              |
| ------------------------------------------- | ------------------- | ----------- | ------ | ----------------------- | ------------------- | ------------- | ------------------ |
| **Clerk**                                   | ✅ (React + Expo)   | JWKS native | ✅     | ~$0–25/ay (10k MAU)     | ✅ (EU dataplane)   | ❌            | **Seçilen**        |
| **WorkOS**                                  | ✅ (React) / ⚠ Expo | JWKS native | ✅     | $125/ay flat (>1k)      | ✅ (EU)             | ❌            | Reddedildi (cost)  |
| **Auth0**                                   | ✅ React / ⚠ Expo   | JWKS native | ✅     | $240/ay (1k MAU, B2C)   | ✅ (EU)             | ❌            | Reddedildi (cost)  |
| **Supabase Auth**                           | ⚠ React / ⚠ Expo    | JWKS native | ✅     | $25/ay tier'la birlikte | ✅ (EU)             | ✅ (Postgres) | Reddedildi (DX)    |
| **Stack Auth**                              | ✅ React / ❌ Expo  | JWKS native | ✅     | $0–free tier            | ⚠ (US default)      | ✅ (Postgres) | Reddedildi (RN)    |
| **Self-host (Lucia/BetterAuth + Postgres)** | ✅ esnek            | manuel      | manuel | $0 + ops yükü           | ✅ (siz seçersiniz) | ✅            | Reddedildi (zaman) |

Reddedilme gerekçeleri:

- **WorkOS** B2B-odaklı; Glaon B2C ağırlıklı, B2B feature setine ödediğimiz fiyat orantısız. SDK Expo için resmi yok (community wrap'leri var).
- **Auth0** kurumsal, fiyat eğrisi 1k MAU'da Clerk'in ~10 katı. Ürünün niche pricing point'iyle uyumsuz.
- **Supabase Auth** Postgres bundle'ıyla geliyor — ama biz MongoDB seçtik (epic #392); auth için ikinci bir Postgres bring-up yapmak gereksiz operasyonel komplikasyon. RN SDK'sı resmi olarak yok, community wrap'leri kırılgan.
- **Stack Auth** modern + open source, ama Expo / RN SDK'sı resmi olarak yayınlanmadı (yalnızca React); EU dataplane opsiyonel ama beta.
- **Self-host (Lucia veya BetterAuth + Postgres)** yapılabilir ve uzun vadede hâkimiyet için cazip; ama Phase 2 sıkı zamanlamada email delivery, MFA, social provider, password reset, account recovery, fraud detection gibi 10+ feature'ı sıfırdan kurmak 4+ hafta yer kaybı. Lansman sonrası bir noktada migration trigger olarak değerlendirilebilir (bkz. tetikleyici bölümü).

## Karar

**Cloud-mod IdP olarak Clerk seçilmiştir.**

Kararın teknik detayları:

### Neden Clerk?

- **React + Expo birinci-sınıf:** `@clerk/clerk-react` ve `@clerk/clerk-expo` ikisi de resmi, aktif maintain. RN new architecture (Hermes, Fabric, Bridgeless) Clerk Expo SDK'sıyla uyumlu — issue tracker'larında resmi onay var.
- **Cost eğrisi düz:** 10k MAU'a kadar ~$25/ay flat (Clerk'in "Pro" plan'ı), sonrası MAU başı ölçek. Lansman + 1 yıl ürün için <%1 burn rate.
- **JWKS-native verify:** Cloud backend Workers runtime'ında JWT'yi standart `jose` (veya benzeri) kütüphanesiyle verify eder; Clerk SDK runtime dependency olmadan sadece JWKS endpoint çağrısı yeterli. Backend Clerk SDK'sına bağımlı **değil** → vendor lock-in cloud-side'da minimum.
- **Feature breadth:** MFA (TOTP + backup codes), password reset, magic link, social (Google + Apple zorunlu, GitHub bonus) — hepsi default-on. Phase 2'de feature kurma süresi 0.
- **EU dataplane:** Clerk'in `dataResidency: 'eu'` opsiyonu 2025'te GA oldu. AB kullanıcı için data EU'da kalır. GDPR processor agreement standart Clerk Pro'da dahil.

### Session model

- **Token:** Short-lived JWT, **1 saat** TTL. Clerk default; uzatma istemiyoruz (sızıntı yüzeyini düşük tutmak).
- **Refresh:** Clerk SDK kendi tarafında otomatik refresh handler'ı ile yapar; istemci kodu manuel refresh çağrısı yazmaz. Refresh token storage ADR 0017 + #9 gereği TokenStore'un `cloud-session` slot grubunda (web in-memory + Clerk cookie; mobile SecureStore).
- **Verification:** Cloud backend her request'te JWT'yi Clerk JWKS endpoint'i (`https://<your-domain>.clerk.accounts.dev/.well-known/jwks.json`) ile verify eder. JWKS cache'lenir (24h TTL); production cache invalidation için Clerk webhook (`session.created` + key rotation event'leri) ileride değerlendirilir (B2 follow-up).
- **JWT claim'leri:** `sub` (Clerk user id), `exp`, `iat`, `iss`, `aud`. Glaon-spesifik claim olarak `homeId` JWT'de **taşınmıyor** — `homeId` pairing'de (ADR 0021) mint edilir, bağımsız bir kavram. Cloud relay session bağlamında `homeId` ayrı bir lookup ile gelir.

### CSP impact

[ADR 0009](0009-ha-addon-ingress-delivery.md) HA Add-on Ingress için sıkı bir CSP zorunlu kılıyor. Clerk Web SDK'sı şu domain'lere erişim ister:

- `https://<your-domain>.clerk.accounts.dev` (auth UI iframe + JS)
- `https://clerk-telemetry.com` (opsiyonel, opt-out edilebilir — opt-out edilecek)
- Görsel asset domain'i: `https://images.clerk.dev`

CSP genişlemesi (cloud-mod aktif olduğunda):

```
script-src 'self' https://<your-domain>.clerk.accounts.dev;
frame-src 'self' https://<your-domain>.clerk.accounts.dev;
connect-src 'self' wss://<cloud-relay-host> https://<your-domain>.clerk.accounts.dev;
img-src 'self' data: https://images.clerk.dev;
```

`unsafe-eval` ve `unsafe-inline` **eklenmeyecek** — Clerk modern (post-2024) SDK'sı evalsız çalışır; CSP report-only mode ile pre-flight test E1 (#352) kapsamında. CSP edit'i bu ADR'in PR'ında değil, E1'in PR'ında iniyor.

### Open questions (deferred)

- **Organization model:** Clerk hem user hem organization sunuyor; multi-home senaryosunu (Phase 5 epic #30) "her ev bir organization" mı, yoksa "kullanıcı user, ev bir custom resource" mı modelleyeceğiz? Phase 2 lansmanında **single user → many homes** modeli yeterli (organizations YOK). Tetikleyici: ev paylaşımı (guest mode #31) feature'ı geldiğinde re-değerlendirme.
- **Webhook integration:** `user.deleted` webhook ile cloud backend'in MongoDB user record'ını cleanup etmesi gerekecek (GDPR right-to-be-forgotten). B2 (#344) bu webhook'u sub-issue olarak ayrı ele alacak.
- **Custom domain:** Clerk default `<slug>.clerk.accounts.dev` subdomain kullanır; production'da `auth.glaon.app` benzeri custom domain CNAME'lemek E5 (deployment hardening) iş tarihine girecek. Phase 2 v0 default subdomain ile ship eder.

## Sonuçlar

### Olumlu

- **Lansman hızı:** Email + password + MFA + social login Phase 2 cloud-mode'un E1/G1 issue'larında 1-2 günde wire'lanır; sıfırdan auth implementasyonu yerine 4+ haftalık tasarruf.
- **Cloud backend lock-in minimum:** Backend yalnız JWKS verify üzerinden çalışıyor. IdP migration cloud kod tabanını dokunmaz; sadece JWKS URL ve issuer string değişir.
- **EU compliance hazır:** GDPR processor agreement Clerk Pro'da default. Self-host ile uğraşma gereği yok.
- **MFA Phase 2'de free:** Self-host'ta MFA başlı başına bir feature build; Clerk'te default açık, kullanıcı opsiyonel olarak etkinleştirir.
- **Mobile parity:** `@clerk/clerk-expo` Expo Go + dev client + EAS build ile uyumlu; deep link redirect built-in. iOS App Store + Play Store sosyal login gereksinimleri Clerk default'larıyla karşılanıyor.

### Olumsuz / ödenecek bedel

- **Vendor lock-in (frontend):** Clerk React/Expo SDK'sı UI bileşenleri sunuyor (`<SignIn />`, `<UserProfile />`); kullandığımız yerde ani migration ucuz değil. Mitigasyon: Glaon-tarafı wrap component'i (`apps/web/src/auth/sign-in-page.tsx`) Clerk SDK'sını encapsulate eder; migration sırasında yalnız bu wrap değişir.
- **Cost MAU-bazlı:** Phase 2 v0'da fiyatla problem yok ama 100k MAU senaryosunda Clerk fiyatı $X+/ay (Clerk pricing tier'ları zamana göre değişiyor). Lansman + 1 yıl finansal modeli OK.
- **Clerk dataplane outage = cloud mod offline:** Clerk down olursa cloud-mod login yapılamıyor. Mitigasyon: local mod aynı zamanda kullanılabilir; UI mod-switcher banner'ında "cloud auth servisi kullanılamıyor — local mod'a geçin" mesajı E1 + E2 (#353) ile eklenir.
- **Custom JWT claim limit:** Clerk session token'ında ek custom claim (örn. `homeId`) eklemek "Pro" plan'da limited; biz `homeId`'yi pairing'le ayrı taşıdığımız için sorun değil ama gelecek custom claim ihtiyacı SDK'nın "session token customization" feature'ına bağımlı.

### Etkileri

- **Frontend bağımlılıkları (E1, G1):** `apps/web/package.json`'a `@clerk/clerk-react`; `apps/mobile/package.json`'a `@clerk/clerk-expo`. Versionlar Renovate ile güncel kalır.
- **Cloud backend (B1, B2):** `jose` (veya benzeri) JWT verify kütüphanesi; Clerk SDK runtime dep **değil**. JWKS endpoint URL'i + audience env var olarak set edilir (ADR 0022 deployment'ta).
- **Env vars:**
  - Frontend: `VITE_CLERK_PUBLISHABLE_KEY` (web), `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (mobile).
  - Cloud backend: `CLERK_JWT_AUDIENCE`, `CLERK_JWKS_URL`, `CLERK_WEBHOOK_SECRET` (B2 webhook için).
- **CSP:** [ADR 0009](0009-ha-addon-ingress-delivery.md)'a Phase 2 hardening turunda Clerk origin'leri eklenir; pre-flight report-only test E1'de.
- **Storybook:** Clerk SDK Storybook story'lerinde mock'lanır — `<ClerkProvider>` Storybook decorator olarak fake bir publishable key ile sarılır. Production publishable key story dosyalarında **yok**.
- **`AuthMode.cloud.session.token`:** [ADR 0017](0017-dual-mode-auth.md)'in IdP-agnostik tip kontratı korunuyor — `session.token` Clerk JWT olarak doldurulur; tip değişmez.

## Tekrar değerlendirme tetikleyicileri

- **Cost burn:** Aylık IdP cost'u $500'ü aşarsa veya MAU başı maliyet self-host break-even'ı geçerse — Lucia/BetterAuth + Postgres self-host migration'ı yeniden masaya gelir. Migration plan: Clerk webhook ile mevcut user'ları self-host DB'ye sync, auth UI'ı yeniden yaz, cutover.
- **Clerk unilateral pricing değişimi:** Clerk'in pricing tier'ı 2× artarsa veya feature degradation olursa.
- **EU compliance gap:** Clerk EU dataplane'inde regression olursa veya GDPR processor agreement'i geri çekerse.
- **RN ecosystem migration:** Expo SDK 60+ veya RN 0.85+ Clerk SDK ile uyumsuzluk yaşarsa (community report'larında).
- **Multi-tenant org ihtiyacı:** Phase 5 multi-home (#30) Clerk organizations modeline ihtiyaç duyarsa, ya Clerk Pro'da kalır organization feature'ını aktif eder ya da self-host'a geçer; karar fiyat eğrisine göre.
- **Webauthn / passkey zorunluluğu:** HA tarafı veya regulatory requirement olarak passkey zorunlu olursa — Clerk passkey support 2025'te GA, sorun olmaması bekleniyor; ama tetikleyici olarak kayıt.

## Referanslar

- Issue [#339 — identity provider — Clerk](https://github.com/toss-cengiz/glaon/issues/339) — bu ADR'in tracking issue'su.
- Issue [#352 — feat(web): Clerk integration (@clerk/clerk-react)](https://github.com/toss-cengiz/glaon/issues/352) — E1 implementation.
- Issue [#355 — feat(mobile): Clerk integration (@clerk/clerk-expo)](https://github.com/toss-cengiz/glaon/issues/355) — G1 implementation.
- Issue [#344 — B2 home registry + Clerk JWT guard](https://github.com/toss-cengiz/glaon/issues/344) — backend verify implementation.
- [ADR 0017 — dual-mode auth](0017-dual-mode-auth.md) — IdP-agnostik tip katmanı.
- [ADR 0018 — cloud relay topology](0018-cloud-relay-topology.md) — `session_refresh` control frame Clerk JWT taşır.
- [ADR 0009 — HA Add-on + Ingress](0009-ha-addon-ingress-delivery.md) — CSP edit'i Phase 2 hardening turunda iniyor.
- Clerk pricing: <https://clerk.com/pricing>
- Clerk Expo SDK: <https://clerk.com/docs/quickstarts/expo>
- Clerk JWT verification: <https://clerk.com/docs/backend-requests/manual-jwt>
- Clerk EU dataplane: <https://clerk.com/docs/deployments/data-residency>
