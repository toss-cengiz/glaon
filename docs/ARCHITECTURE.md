# Mimari

Bu belge Glaon'un yüksek seviyeli mimarisini, üç istemci için auth akışını ve paket bağımlılıklarını açıklar.

## Genel Bakış

```
┌─────────────────────────┐        ┌──────────────────────────────┐
│  Home Assistant Core    │◄──────►│  Glaon Add-on (nginx)        │
│  (auth, ws, services)   │        │  Ingress üzerinden web app   │
└─────────────────────────┘        └──────────────────────────────┘
          ▲           ▲                            ▲
          │           │                            │
  OAuth2  │           │ OAuth2                     │ Ingress (HA oturum çerezi ile)
          │           │                            │
┌─────────┴──────┐  ┌─┴────────────────┐  ┌────────┴─────────┐
│  Mobile (Expo) │  │  Tarayıcı (web)   │  │  Tablet (kiosk)   │
│  expo-auth-    │  │  Vite + React     │  │  Vite + React      │
│  session       │  │                   │  │  (tam ekran)       │
└────────────────┘  └───────────────────┘  └────────────────────┘
```

## İstemci Modları

`VITE_APP_MODE` (web) üç değer alır:

- `ingress`: Web uygulaması HA Add-on olarak Ingress üzerinden servis edilir. Auth yine OAuth2 ile yapılır, fakat `redirect_uri` Ingress yoluna göre ayarlanır.
- `standalone`: Web uygulaması Glaon'un kendi alan adında çalışır. OAuth2 akışı dış tarayıcıda tamamlanır.
- `kiosk`: Tablet modu. Otomatik yeniden bağlanma, ekran koruyucu devre dışı, dokunmaya dayalı büyük hedefler.

## Kimlik Doğrulama — OAuth2 PKCE

Üç istemci de aynı akışı kullanır:

1. `@glaon/core/auth` → `buildAuthorizationRequest()` PKCE `code_verifier` + `state` üretir, HA `/auth/authorize` URL'sini döner.
2. İstemciye göre akış:
   - **Web**: Tam sayfa yönlendirme (`window.location.assign`).
   - **Mobile**: `expo-auth-session` ile sistem tarayıcıda (ASWebAuthenticationSession / Custom Tabs) açılır.
3. HA kullanıcıyı `redirect_uri`'ye `code` + `state` ile döndürür.
4. `state` doğrulanır, `exchangeCodeForTokens()` çağrılır.
5. `access_token` + `refresh_token` **güvenli depolamaya** yazılır:
   - Web: in-memory + `httpOnly` çerezi (mümkünse service worker aracılı); `localStorage` **kullanılmaz**.
   - Mobile: `expo-secure-store` (Keychain / Keystore).
6. WebSocket bağlantısı `access_token` ile açılır; HA protokolü `auth` mesajı bekler.
7. Token süresi dolduğunda `refreshAccessToken()` arka planda çalışır.

## Home Assistant WebSocket

`@glaon/core/ha/client.ts` tek bağlantı noktasıdır. Sorumlulukları:

- Auth handshake
- Varlık (entity) abonelikleri (`subscribe_events`, `subscribe_entities`)
- Servis çağrıları (`call_service`)
- Otomatik yeniden bağlanma (exponential backoff + jitter)
- Token yenileme entegrasyonu

Faz 1'de tamamlanacak.

## Paket Bağımlılık Grafiği

```
@glaon/web  ┐
            ├─► @glaon/ui  ─► (Untitled UI kaynakları — dışarıda)
@glaon/mobile ┘
            └─► @glaon/core ─► (standart kütüphane + fetch + WebSocket)
```

`@glaon/core` **platform-agnostik** kalır: DOM, React, React Native importu yoktur. Platforma özgü kod (SecureStore, WebBrowser, vb.) `apps/*` altında yaşar.
