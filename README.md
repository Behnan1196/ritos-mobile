# Ritos mobil

Ritos'un mobil sürümü: günlük ajanda, rutinler ve yaşam alanları dengesi. Expo (SDK 57) + TypeScript + expo-router + expo-sqlite.

**Dilim 1:** hesap yok, ağ yok, şifreleme yok — her şey cihazda, SQLite'ta. Mimari kararlar ve veri modeli: [`docs/MIMARI.md`](docs/MIMARI.md).

## Windows'ta çalıştırıp iPhone'da Expo Go ile açmak

### Bir kez yapılacaklar

1. **Node.js LTS** (22 ya da üstü) kur: https://nodejs.org → "LTS" sürümünü indir, kurulumda varsayılanları bırak.
2. **Git** kur: https://git-scm.com/download/win
3. iPhone'a App Store'dan **Expo Go** uygulamasını kur. Güncel olsun: uygulama SDK 57 ile çalışıyor; Expo Go eskiyse "uyumsuz SDK" hatası verir.
4. Bilgisayar ve iPhone **aynı Wi-Fi ağında** olsun.

### Çalıştırma

PowerShell'i aç:

```powershell
git clone https://github.com/Behnan1196/ritos-mobile.git
cd ritos-mobile
npm install
npx expo start
```

Terminalde bir QR kodu çıkar. iPhone'da **Kamera** uygulamasıyla QR'a bak, çıkan bildirime dokun → uygulama Expo Go'da açılır. Kodda değişiklik yaptıkça telefonda kendiliğinden yenilenir.

Sorun çıkarsa:

- **Windows Güvenlik Duvarı** ilk çalıştırmada Node.js için izin sorar → "Özel ağlar"a izin ver. Sormadıysa ve telefon bağlanamıyorsa: Windows Güvenlik → Güvenlik duvarı → "Bir uygulamaya izin ver" → Node.js'i özel ağlar için işaretle.
- Ağın cihazların birbirini görmesine izin vermiyorsa (okul/iş Wi-Fi'ı, misafir ağı) tünel kullan: `npx expo start --tunnel` (ilk seferde ek bir paket kurmayı önerir, "evet" de).
- Expo Go "Something went wrong" derse terminalde `r` tuşuna basıp yeniden yükle; olmazsa `npx expo start -c` (önbelleği temizler).

### Tarayıcıda önizleme

```powershell
npx expo start --web
```

ya da `npx expo start` açıkken terminalde `w` tuşuna bas. Veriler tarayıcının kendi depolamasında tutulur (telefondakinden ayrıdır).

### Denetimler

```powershell
npx tsc --noEmit   # tip denetimi
npm test           # saf mantık birim testleri (Jest)
```

## Proje yapısı

```
src/app/       ekranlar (expo-router): sekmeler, rutin detayı, form modalları, ilk açılış
src/bilesen/   tema ve ortak arayüz parçaları
src/mantik/    saf mantık + testleri: tekrar, denge, rutin döngüsü, tarih, alanlar
src/veri/      SQLite: şema/migrasyon, eşleme, depo (tüm okuma/yazma), değişiklik yayını
docs/          mimari notları
```

## Dilim 2 için notlar

Dilim 2 = paylaşım: hesap (e-posta + Google/Apple), gruplar, ortak liste, kart atama, Supabase Realtime. Şema taslağı `docs/MIMARI.md` içinde. Başlarken:

- **Ayrı Supabase projesi** (`ritos-mobile`, ayrı hesap) açılacak; web sürümünün projesine dokunulmayacak. Anahtarlar `.env` / `app.config` ile verilecek, depoya girmeyecek.
- **Paketler:** `@supabase/supabase-js` saf JS'tir, Expo Go'da çalışır. Oturum saklama için `expo-secure-store` ya da `expo-sqlite/kv-store` (ikisi de Expo Go'da var). Google/Apple girişi için `expo-auth-session` / `expo-apple-authentication` — Apple girişi gerçek cihazda ve App Store yapılandırmasıyla tam test edilir.
- **Kişisel veri cihazda kalır.** Mevcut SQLite tabloları (yasam_alani, rutin, kart, kayit) sunucuya gitmez. Paylaşılan veri sunucudaki tablolarda durur, cihaz yalnız önbellek tutar (ayrı yerel tablolar, ör. `onbellek_*`).
- **Yazma kapısı hazır:** tüm yerel yazmalar `src/veri/depo.ts` içindeki `yaz()` üzerinden geçiyor. Paylaşılan tablolar için "bekleyen listesi" (outbox) buraya eklenir: çevrimdışıyken sıraya alınır, bağlanınca düz insert/update ile gönderilir.
- **Canlılık:** Realtime aboneliği açılınca önce son `guncellendi`den sonrası bir kez çekilir (kaçanlar), sonra `postgres_changes` dinlenir. Gelen değişiklik önbelleğe yazılıp `degisti()` (src/veri/olay.ts) çağrılır; ekranlar `useVeri` ile kendiliğinden yenilenir. Uygulama arka plana geçince abonelik kapanır (`AppState`).
- **Çakışma:** satır düzeyinde son yazan kazanır; `guncellendi` her satırda var. Silmeler için yerelde `silinen` tablosu iz tutuyor; sunucuda `silindi` bayrağı kullanılıyor.
- **Atanan kart:** `atanan_kartlar.kart` alanı mobil kart biçimini (tip, ad, aciklama, baslangic, bitis, gunler, saatler) taşır; alan kişi kabul edince ajandasında gösterilir, gün durumu `kart_kayitlari`na yazılır. Tekrar mantığı (`src/mantik/tekrar.ts`) aynen kullanılabilir.
- **Hesabımı sil:** `hesabimi_sil()` security definer fonksiyonu → `auth.users` satırı silinir, cascade ile her şey gider (App Store şartı). Ayarlar ekranına eklenecek.
- Yeni yerel tablo/kolon gerekiyorsa `src/veri/sema.ts` içindeki `MIGRASYONLAR` dizisinin **sonuna** yeni adım eklenir; var olan adımlar değiştirilmez.

## Bu dilimde olmayanlar

Hesap, Supabase, şifreleme, bildirim, Kütüphane, Çevrem/paylaşım, kart blokları (açıklama şimdilik düz metin), radar grafik.
