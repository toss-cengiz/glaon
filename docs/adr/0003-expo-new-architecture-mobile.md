# ADR 0003 — Expo SDK + new architecture (mobile)

- **Durum:** Accepted
- **Karar tarihi:** 2026-04-20
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [CLAUDE.md — Stack](../../CLAUDE.md#stack)

## Bağlam

Glaon mobile tarafı iOS ve Android'de tek kod tabanıyla yürüyecek. Gereksinimler:

- OAuth2 Authorization Code + PKCE akışı (ADR 0005) — in-app browser için güvenli redirect gerekiyor.
- Token'lar güvenli storage'da (iOS Keychain / Android Keystore) kalacak.
- Home Assistant WebSocket bağlantısı arka planda yaşayacak.
- `@glaon/core` paylaşımlı paketi aynı TS kaynağından Vite + Metro tüketecek (ADR 0004).
- Geliştirme döngüsü hızlı olmalı — sadece tek mobil geliştirici var, native build süresi darboğaz yaratmamalı.

Değerlendirilen seçenekler:

- **Flutter:** UI kalitesi ve performans iyi, ama Dart ayrı dil, paylaşım paketi (`@glaon/core`) yeniden yazmak gerekecek. React 19 ile uyumlu değil.
- **React Native (bare, yeni mimari):** Tam kontrol ama iOS/Android native proje dosyalarını tek kişilik ekiple yönetmek maliyetli. Auth için `expo-auth-session`'un bare eşdeğerini elle kurmak gerekir.
- **Expo SDK (managed workflow, new architecture on):** OAuth için `expo-auth-session`, secure storage için `expo-secure-store`, Sentry entegrasyonu için hazır plugin. New architecture (Fabric + TurboModules) default olarak açık. Development client ile custom native modül gerektiğinde EAS Build ile çıkılır.
- **Expo Go (dev only):** Custom native modül desteklemediği için sınırlı — OAuth akışı için production'da zaten dev client gerekiyor. Araç olarak kullanılır ama tek başına yeterli değil.
- **Kotlin Multiplatform + SwiftUI:** Native UI kalitesi en yüksek, geliştirme maliyeti çok yüksek. Paylaşım paketi paradigması uyumsuz.

React Native yeni mimarisi (Fabric renderer + TurboModules + JSI) 0.76'dan beri stabil ve 0.81'de default. Eski mimari deprecate yolunda. Yeni proje için eski mimariye start etmek önemli bir anti-pattern.

## Karar

Mobile uygulaması **Expo SDK 55 (managed) + React Native 0.81 (new architecture on) + React 19** üzerine kurulur.

- `apps/mobile` paketi Expo managed workflow. Custom native modül gerektiğinde EAS Build + development client flow'una geçilir.
- React Native yeni mimarisi (`newArchEnabled: true` app.json'da) baştan açık.
- OAuth için `expo-auth-session`, secure storage için `expo-secure-store`, deep linking için `expo-linking`, observability için `@sentry/react-native` (Expo plugin).
- TypeScript strict mode, @glaon/core'u Metro resolver ile tüketir.

## Sonuçlar

### Olumlu

- OAuth2 PKCE akışı için `expo-auth-session` zaten PKCE destekli — güvenlik-kritik code'u kendimiz yazmıyoruz.
- Secure store API'si iOS Keychain + Android Keystore'a tek API'den erişiyor.
- Development cycle hızlı: dev client üzerinden Metro reload sub-saniye.
- EAS Build ile iOS signing + Android release derlemesi native toolchain sahibi olmadan yürüyor.
- New architecture açık olması → gelecekte web için `react-native-web-vite` köprüsü (Storybook'ta zaten var) ile paylaşılan primitive'lere yol açık.

### Olumsuz / ödenecek bedel

- Expo'nun "managed" seçimi bazı native modülleri dışarıda bırakıyor. Custom modül gerekirse dev client'a geçmek ve EAS Build hattına girmek şart — küçük ama gerçek friction.
- SDK upgrade'leri yılda 2 kere major, ekosistem bu tempoyu takip ederken test yükü yüksek.
- EAS Build ücretsiz katmanı aylık limit var; CI/CD yoğunluğu artınca maliyet gündeme gelir.

### Etkileri

- Mobile CI job'u `eas-cli` ile entegre edilecek (issue açılacak).
- `@glaon/core` paketi Metro resolver'a `exports` field üzerinden çıkmak zorunda (ADR 0004).
- Storybook'un React Native preview'i için `react-native-web-vite` adaptörü (issue #47) gerekti; paylaşılan primitive'lerin hem Metro hem Vite'dan tüketilmesinin yan etkisi.

## Tekrar değerlendirme tetikleyicileri

- Expo'nun EAS Build ücretsiz katmanı Glaon için yeterli olmazsa (CI self-host değerlendirilir).
- New architecture'ın breaking change'i kütüphane ekosistemini ikiye bölerse.
- Native modül ihtiyacı o kadar ağırlaşırsa ki bare RN'e geçmek daha verimli olur.

## Referanslar

- [Expo SDK docs](https://docs.expo.dev)
- [React Native new architecture](https://reactnative.dev/docs/the-new-architecture/landing-page)
- [`expo-auth-session` PKCE flow](https://docs.expo.dev/versions/latest/sdk/auth-session/)
