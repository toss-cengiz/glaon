# Yol Haritası

Sürümler anlamlı teslimatlarla işaretlenir; tarihler yaklaşıktır. Güvenlik çalışması (Faz 3) tüm fazlara paraleldir.

## Faz 0 — Temel (1-2 hafta) ✅ başlatıldı

- [x] Monorepo iskeleti (Turborepo + pnpm workspaces)
- [x] TypeScript strict konfigürasyonları
- [x] Paket iskeletleri: `@glaon/web`, `@glaon/mobile`, `@glaon/core`, `@glaon/ui`, `@glaon/config`
- [x] HA Add-on iskeleti (nginx, Ingress, AppArmor)
- [x] GitHub Actions CI (type-check, lint, audit)
- [ ] `pnpm install` ile bootstrap doğrulaması
- [ ] Husky + lint-staged pre-commit kancaları
- [ ] `gitleaks` pre-commit + CI taraması

## Faz 1 — HA Entegrasyonu (1-2 hafta)

- [ ] OAuth2 PKCE akışı web için uçtan uca
- [ ] OAuth2 PKCE akışı mobile için (`expo-auth-session`)
- [ ] Token depolama: in-memory (web) + SecureStore (mobile)
- [ ] HA WebSocket client — handshake, abonelikler, reconnect
- [ ] Varlık (entity) state yönetimi (immer / zustand önerisi)
- [ ] Servis çağrısı API'si (`light.turn_on`, vb.)
- [ ] E2E smoke: test HA instance'ına bağlan, entity listesi çek

## Faz 2 — Ana UI (2-3 hafta)

- [ ] Untitled UI React kit entegrasyonu
- [ ] Tema tokenları (light/dark), tipografi, grid
- [ ] Kök navigasyon: oda görünümü, cihazlar, otomasyon, enerji
- [ ] Varlık kartları: light, switch, climate, cover, media_player
- [ ] Tablet kiosk düzeni (büyük hedefler, uyumadan çalışan bağlantı)
- [ ] Responsive breakpoint stratejisi

## Faz 3 — Güvenlik Sertleştirme (Faz 0'dan itibaren sürekli)

- [ ] `gitleaks` hook + CI taraması
- [ ] `pnpm audit --prod` CI kırıcı
- [ ] Renovate bot + güvenlik güncelleme fast-lane
- [ ] CSP / HSTS / Permissions-Policy / Referrer-Policy başlık testi
- [ ] Mobile: SecureStore + sertifika pinning
- [ ] Add-on: root dışında kullanıcı, AppArmor ince ayar
- [ ] OWASP ASVS L2 kontrol listesi geçişi

## Faz 4 — Özellikler (iteratif)

- [ ] Sahne (scene) ve otomasyon yönetimi
- [ ] Enerji paneli + tarihsel grafikler
- [ ] Kamera akışları ve kapı zili
- [ ] Bildirimler (mobile push — Expo Notifications)
- [ ] Çoklu ev (multi-home) desteği
- [ ] Konuk modu (guest mode) — sınırlı yetki token'ı

## Faz 5 — Polish ve Dağıtım

- [ ] Performans: bundle analizi, lazy routes, React profil ölçümleri
- [ ] Erişilebilirlik: WCAG AA geçişi, klavye navigasyonu
- [ ] i18n iskeleti (en, tr başlangıç)
- [ ] HA Add-on store başvurusu
- [ ] iOS App Store / Google Play dağıtımı (EAS Build + Submit)
- [ ] Belgelendirme: kullanıcı rehberi, SSS, sorun giderme

## Kararlar ve Açık Sorular

- **State yönetimi**: zustand mı, redux-toolkit mi? Faz 1 başında karar.
- **i18n kütüphanesi**: `react-i18next` vs `lingui` — Faz 5 kararı.
- **Grafik**: Recharts mı, Victory Native XL mi? Tek kütüphane web + mobilde çalışmalı.
