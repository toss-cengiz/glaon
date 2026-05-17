# ADR 0028 — Cihaz konfigürasyon state'i (first-run setup wizard + factory-reset zemini)

- **Durum:** Accepted
- **Karar tarihi:** 2026-05-17
- **Karar verenler:** @toss-cengiz
- **İlgili konular:** [issue #533](https://github.com/toss-cengiz/glaon/issues/533) (epic), [issue #534](https://github.com/toss-cengiz/glaon/issues/534) (bu ADR), [issue #535](https://github.com/toss-cengiz/glaon/issues/535) (ConfigStore implementasyonu), [ADR 0004](0004-glaon-core-platform-agnostic.md) (`@glaon/core` platform-agnostic kuralı), [ADR 0006](0006-token-storage.md) (token storage paterni — bu ADR onu mirror ediyor), [ADR 0009](0009-ha-addon-ingress-delivery.md) (Ingress teslim kanalı)

## Bağlam

Glaon bugün yeni bir kullanıcının ilk açılışında doğrudan **mode-select / login** ekranına düşüyor. Cihaz seviyesinde "bu cihazda Glaon ilk defa mı açılıyor, daha önce yapılandırıldı mı?" sorusunu cevaplayabileceğimiz bir state yok. Duvar tableti ve PWA kullanım senaryosu için bu, kullanıcıyı uygulamayı kullanılabilir hale getirmek için gereken bilgileri (ev adı, ülke/timezone/locale, Wi-Fi, admin PIN) toplama imkânı bırakmıyor.

Phase 2 first-run setup wizard'ı (Figma node [`1277:791`](https://www.figma.com/design/cDLzPUkcsDJtvwqZLWRwrd/Design-System?node-id=1277-791) — epic #533) bu boşluğu dolduruyor. Wizard'ın yazacağı state ile ilgili dört bağlantılı karar bekleniyor:

1. **Saklama interface'i nerede yaşar?** Web `localStorage`'a doğrudan mı yazsın, yoksa `@glaon/core` içinde platform-agnostic bir interface üzerinden mi gitsin? Mobile parity bu epic'in dışı ama yakında geliyor.
2. **"Cihaz yapılandırıldı" sinyali ne?** Doluluk bazlı mı ("tüm alanlar non-null") yoksa zaman damgalı mı (`completedAt`)?
3. **Saklama namespace'i ne?** Cross-platform debug ve factory-reset operasyonu tek bir anahtar üzerinden çalışsın istiyoruz.
4. **HA Ingress modunda wizard çalıştırılmalı mı?** HA Add-on olarak çalışırken HA zaten yapılandırılmış; wizard sorularının çoğu ya tekrar ya da HA tarafından otomatik cevaplanabilir.

Saldırı modeli notu: cihaz config'i credential değil. PIN hash'i (#547) hariç hiçbir alan secret değil — homeName, country, timezone, locale, layout serbest plaintext. PIN bile SHA-256 hash olarak yazılır, plaintext'i Glaon'a hiç ulaşmaz. Wi-Fi şifresi tek istisna; o ConfigStore'a yazılmadan önce sembolik "passwordCipher" alanına dönüşür (#546 + #548 detaylarını verir), wizard route içinde plaintext belleğin dışına çıkmaz.

Göz önünde bulundurulan alternatifler:

- **Seçenek A — Web doğrudan `localStorage`, mobile doğrudan `expo-secure-store`, paylaşılan interface yok.** Her platform kendi key'ini, kendi şemasını, kendi "configured" semantiğini tutar. Reddedildi: aynı kararı iki kere almak zorunda kalırız, factory-reset operasyonu iki yerde çöker, schema migration'ı senkronize etmek imkânsızlaşır. [ADR 0004](0004-glaon-core-platform-agnostic.md) "shared core" prensibine de aykırı.
- **Seçenek B — `TokenStore`'a (ADR 0006) `device-config` slot'u ekle.** Credential ve config aynı surface'te birikir. Reddedildi: token store'un saldırı modeli (XSS sızıntısı, refresh rotation, hardware-backed keystore) config için over-engineered; cookie/SecureStore katmanları config alanları için anlamsız maliyet. Ayrıca config'in factory-reset semantiği ile token'ın logout semantiği farklı — kullanıcı logout olduğunda config silinmemeli.
- **Seçenek C — `ConfigStore` ayrı interface, `TokenStore` paternini mirror et (seçilen).** Karar bölümünde detay.
- **Seçenek D — Config'i HA tarafında tut (HA `frontend.storage` veya custom integration).** Cihaz daha açılırken "buraya hangi HA'ya bağlanacağım?" cevabı bilinmiyor; first-run gating'in tanımı gereği yerel olmak zorunda. Ayrıca HA'ya ulaşamadığımız anda (Wi-Fi yok, HA down) wizard tetiklenemiyor → kullanıcı kilitleniyor. Reddedildi.

"Configured" sinyali için iki seçenek:

- **A — Doluluk bazlı (`isConfigured = required fields hepsi non-null`).** Reddedildi: şemaya alan eklediğimiz anda mevcut yapılandırılmış cihazlar retro-configured oluyor — wizard yeniden tetiklenip kullanıcıyı tekrar boğazlıyor. Tersi durumda kullanıcı bir adımı boş geçtiğinde de wizard tamamlanmış sayılmıyor; "Skip" affordance'larıyla çakışıyor.
- **B — Zaman damgası (`completedAt: ISOString`) (seçilen).** Schema migration'ı şeffaf; opsiyonel alanlar opsiyonel kalabiliyor; wizard'ın son adımının (#548 Review + commit) tek görevi `markComplete()` çağırmak.

Wizard'ın Ingress modunda çalışıp çalışmayacağı için iki seçenek:

- **A — Ingress'te de çalışsın (mode-agnostic).** HA Add-on olarak teslim edildiğimizde kullanıcı zaten HA'yı yapılandırmış; ev adı, timezone, locale HA'da zaten var. Wizard tekrarlı soru sorar, Wi-Fi adımı (#546) Supervisor `/api/hassio/network/info`'yu zaten Ingress'te çalıştırabilir ama "hangi network'e bağlısın" cevabı çoktan kararlaştırılmış. Reddedildi v1 için: tekrarlı soru ürün açısından kötü.
- **B — Ingress'te skip, standalone + kiosk'ta tetikle (seçilen v1).** `VITE_APP_MODE === 'ingress'` durumunda SetupGate wizard'ı atlar. Ingress-tuned wizard varyantı (gerekli alanları HA'dan çekip kullanıcıya sadece eksik olanları sormak) ayrı bir issue olarak takip edilir.

## Karar

**Glaon, cihaz seviyesinde yapılandırma state'ini `@glaon/core` içinde tanımlanan `ConfigStore` interface'i üzerinden saklar. Web platformu `localStorage`'a (`glaon.device-config` anahtarı), mobile platformu `expo-secure-store`'a (`glaon.device-config` anahtarı) yazan adapterlerle bağlanır. "Cihaz yapılandırıldı" sinyali, saklanan blob içindeki `completedAt: ISOString` alanının varlığıdır — şema doluluğuna bakılmaz. Wizard `VITE_APP_MODE === 'ingress'` durumunda atlanır.**

Karar'ın teknik detayları:

### `ConfigStore` interface

`packages/core/src/config/config-store.ts`:

```ts
export interface ConfigStore {
  get(): Promise<DeviceConfig | null>;
  setPartial(partial: Partial<DeviceConfig>): Promise<void>;
  markComplete(): Promise<void>;
  isConfigured(): Promise<boolean>;
  clear(): Promise<void>;
}
```

- Tüm metodlar `Promise` döner — web'de `localStorage` senkron olsa da contract'ı senkron mobile (SecureStore async) ile uyumlu tutmak için. Web adapter `Promise.resolve()` ile sarar.
- `get()` corrupt blob (JSON parse veya zod safeParse hatası) durumunda `null` döner ve adapter sessizce `clear()` çağırır — kullanıcı first-run davranışına düşer. Adapter `console.warn` ile log atar (debuggability), kullanıcıya hata göstermez.
- `setPartial` mevcut blob ile sığ merge yapar; alan silmek için `undefined` değer geçilir.
- `markComplete()` `completedAt: new Date().toISOString()` yazar — idempotent, ikinci çağrı timestamp'i günceller.
- `isConfigured()` `Boolean(get()?.completedAt)`. Şema değişikliklerinden bağımsız.
- `clear()` factory-reset'in çağıracağı tek metod. Adapter blob yoksa hata atmaz (idempotent).

### `DeviceConfig` şeması

`packages/core/src/config/types.ts` (Zod):

- `schemaVersion: number` — başlangıç `1`. Şema değişikliklerinde migration anahtarı.
- `homeName?: string`
- `location?: string` (v1 free text; Maps integration sonraki epic'te)
- `country?: string` (ISO 3166-1 alpha-2)
- `timezone?: string` (IANA TZ)
- `locale?: string` (BCP-47, `SUPPORTED_LOCALES` ile validasyon)
- `unitSystem?: 'metric' | 'imperial'`
- `layout?: string` (v1 placeholder — gerçek floor/room editor ayrı epic)
- `wifi?: { ssid: string; passwordCipher: string }` — `passwordCipher` core için opak; tüketici (#546 + #548) ne saklayacağına karar verir, core sadece "non-empty string" enforce eder.
- `securityPinHash?: string` (SHA-256 hex, #547)
- `completedAt?: string` (ISO-8601; varlığı `isConfigured()` cevabı)

Şema doluluk dışındaki invariant'lar zod schema'da enforce edilir. Bilinmeyen alanlar reddedilir (`.strict()`) — eski versiyon Glaon'un yazdığı blob yeni versiyonda parse edilemezse `null` dönüp `clear()` ile temizlenir; kullanıcı first-run'ı tekrar yapar. (v1'de bu kabul edilebilir; downgrade'in bizim için kullanım case'i yok.)

### Saklama namespace'i

- Web: `localStorage.getItem('glaon.device-config')`
- Mobile: `SecureStore.getItemAsync('glaon.device-config')`

Aynı key — cross-platform debug ve `apps/devtools` (gelecek) için tek mental model.

### App boot sequence

`apps/web/src/App.tsx` (#536 + #539):

```tsx
<ConfigProvider configStore={configStore}>
  <AuthProvider tokenStore={tokenStore}>
    <ToastProvider>
      <SetupGate>
        {clerkKey ? <CloudSessionBridge /> : null}
        <Router clerkKey={clerkKey} />
      </SetupGate>
    </ToastProvider>
  </AuthProvider>
</ConfigProvider>
```

`SetupGate`:

- `VITE_APP_MODE === 'ingress'` → children render (wizard atlanır).
- `useDeviceConfig().isConfigured()` `false` → `<SetupRoute>` render.
- Else → children (mevcut Router) render.

### Factory reset kontratı (kapsam dışı, sadece şekli donduruluyor)

Factory reset operasyonu (ayrı follow-up issue):

```ts
async function factoryReset() {
  await configStore.clear();
  await tokenStore.clear(); // ADR 0006
  window.location.assign('/');
}
```

Bu ADR sadece şekli donduruyor; UI affordance + onay diyalogu + telemetry follow-up issue'da iş yapacak.

## Sonuçlar

### Olumlu

- First-run gating yerel — HA'ya ulaşmadan da çalışır; kullanıcı offline iken bile wizard'a düşer (yapılandırma deneyimi izole).
- `completedAt` semantiği şema migrationlarını sancısız yapar; mevcut yapılandırılmış cihazlar wizard'a düşmez.
- `ConfigStore` interface'i mobile follow-up'ı tek adaptör eklemeye indirir; Glaon'un "shared core" prensibi (ADR 0004) korunur.
- Factory reset tek `clear()` çağrısı ile çözülür — UI tarafı veri şekli ile uğraşmaz.
- Aynı namespace key web + mobile + devtools'ta tutarlı debug deneyimi sağlar.
- `VITE_APP_MODE` branching daha önce tanımlı ama tüketilmeyen flag'i ilk gerçek kullanıcısına bağlar; mode-aware behavior için referans pattern olur.

### Olumsuz / ödenecek bedel

- Async `ConfigStore` interface web'de gereksiz mikro maliyet — `localStorage` senkron olduğu için `Promise.resolve()` wrap sıfır iş yapar ama React `useState` initial render'ı boot'ta bir tick gecikir. Pratik etkisi yok; ölçtüğümüzde 1-2 ms düzeyinde.
- Bilinmeyen alanların `null` dönüp `clear()` ile temizlenmesi, downgrade senaryosunda kullanıcıyı first-run'a düşürür. v1'de downgrade desteklenen bir akış değil; gerçek olursa migration logic'i eklenir (schemaVersion anahtarı zaten yerinde).
- Ingress'te wizard'ı atlamak, Ingress kullanıcısının ileride `factoryReset` çağırması durumunda config eksik kalmasını yaratır — pratik olarak HA Ingress'te factory reset ile config sıfırlanması durumda `SetupGate` yine atlayacak. Kabul edilen davranış: Ingress modda config blob "boş" olmalı; gerekli ayarlar HA'dan çekilir.
- Wi-Fi şifresi'nin "passwordCipher" alanına nasıl döneceği bu ADR'nin scope'unda değil — #546 + #548 implementasyon zamanı tüketici kararı verecek. v1'de plaintext'in localStorage'a yazılmaması netleştirilmiş (wizard route bellek state'i), ciphering şekli açık.

### Etkileri

- `packages/core/src/config/` yeni modül; `@glaon/core` ihracat yüzeyi `./config` ile genişler.
- `apps/web/src/config/` yeni klasör; `WebConfigStore` adapter + `ConfigProvider` React context.
- `apps/web/src/App.tsx` provider zinciri en dışa `ConfigProvider` ekler; `SetupGate` `<Router>`'ı sarar.
- Mobile parity follow-up issue açılır; `ExpoConfigStore` aynı interface'i implement eder, kod yapısı `WebConfigStore` + `apps/mobile/src/auth/expo-token-store.ts` ikilisini mirror eder.
- Factory-reset UI follow-up issue açılır; sadece `clear()` çağırır, şema bilgisi gerektirmez.
- Ingress-tuned wizard varyantı follow-up issue açılır; HA'dan çekilebilen alanları pre-fill eden ayrı bir SetupRoute varyantı tasarlanır.
- Eslint kuralı (#535 PR'ında değerlendirilir): `apps/web/src/config/web-config-store.ts` dışında `glaon.device-config` literal'inin kullanılması yasaklanır — sızıntı engelleyici.

## Tekrar değerlendirme tetikleyicileri

- Mobile adapter implementasyonu sırasında SecureStore'un async-only davranışının web ile farklı bir contract gerektirmesi (örn. `Suspense` ile boot gating zorunluluğu).
- Glaon'un device-attribute store'unu HA'ya backup/sync etme ihtiyacı doğarsa (multi-device "ayarlarımı aynı evdeki başka tablete taşı") — bu, "config sadece yerel" varsayımını kıracaktır; yeni ADR.
- HA Ingress'te wizard'ın gerçekten gerekli olduğu kullanım case'i (örn. multi-instance yönetimi) ortaya çıkarsa — Ingress branching kararı yeniden açılır.
- Schema'ya birden fazla migration biriktiğinde — `schemaVersion` üzerinden upgrade path'i tanımlayan ek bir ADR yazılır.

## Referanslar

- [Epic #533 — device setup wizard](https://github.com/toss-cengiz/glaon/issues/533)
- [docs/device-setup-wizard.md](../device-setup-wizard.md) (#550 ile birlikte landing yapacak)
- [ADR 0004 — `@glaon/core` platform-agnostic](0004-glaon-core-platform-agnostic.md)
- [ADR 0006 — Token storage](0006-token-storage.md)
- [ADR 0009 — HA Add-on + Ingress teslim kanalı](0009-ha-addon-ingress-delivery.md)
- [CLAUDE.md — Security-First Rules](../../CLAUDE.md#security-first-rules)
