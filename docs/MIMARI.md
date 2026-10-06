# Ritos mobil — Mimari v0

Depo: https://github.com/Behnan1196/ritos-mobile · Supabase: ayrı proje `ritos-mobile` (ayrı hesap) · Web sürümü (ritos-app) olduğu gibi devam eder.

## Kararlar

1. **Şifreleme yok.** Kişisel veri cihazdan çıkmaz; paylaşılan veri düz tablolarda, yetkiyi RLS belirler.
2. **Hesapsız başlangıç.** Uygulama hesap açmadan tam çalışır (Ajandam, Rutinlerim, denge). Hesap yalnız paylaşım (Çevrem) ya da ileride çok cihaz/yedek için istenir.
3. **İki veri dünyası:**
   - Kişisel → cihazda SQLite (expo-sqlite). Sunucuya gitmez (Plus'ta yedek/çok cihaz sonra).
   - Paylaşılan → doğrudan Supabase tablolarında, kaynağı sunucu. Cihaz önbellek tutar.
4. **Canlılık Supabase Realtime ile** (postgres_changes, RLS süzgeçli). Web'deki "op → şifrele → kuyruk → çekiş → uygula" boru hattı mobilde yok; anahtar dağıtımı yok.
5. **Korunanlar:** kart biçimi (TemelTip + Blok paleti), rutin / yaşam alanı / denge / rutin döngüsü kavramları, tekrar mantığı (`baslangic`, `bitis`, `gunler`, `saatler`, `atla`).
6. **Ayrı Supabase projesi:** `auth.users` yalnız Ritos'un → "hesabımı sil" gerçek silme (App Store şartı). Tablolar öneksiz.
7. **Teknoloji:** Expo (güncel SDK) + TypeScript + expo-router + expo-sqlite. Telefonda deneme Expo Go ile (Apple geliştirici üyeliği gerekmez); TestFlight/App Store aşamasında üyelik (yılda 99 $).

## Realtime notları

- Çevrimdışıyken değişiklikler yerel bekleyen listesinde durur, bağlanınca düz insert/update ile gider; sonra abonelik açılır ve son `guncellendi`den sonrası bir kez çekilir (kaçanlar).
- Çakışma kuralı: satır düzeyinde son yazan kazanır; liste maddeleri gibi küçük satırlar seçildiği için pratikte sorun az.
- Ücretsiz planda ~200 eşzamanlı bağlantı pilot için yeter; uygulama arka plandayken abonelik kapanır.

## Dilimler

- **Dilim 1 (yerel, hesapsız):** ilk açılış (alan seçimi), Ajandam (gün görünümü, kart ekle/düzenle, yapıldı), Rutinlerim (rutin kur, kartlar, alanlar, Kuruluyor/Oturdu/Arşiv), basit denge.
- **Dilim 2 (paylaşım):** hesap (e-posta + Google/Apple), gruplar (aile/arkadaş/ekip, 12 kişi), ortak liste, kart atama + durumu, Realtime. Aşağıdaki şema.
- **Dilim 3:** bildirimler (yerel hatırlatma), Kütüphane, hazır başlangıç paketleri / rehberli kurulum, ücretli plan (RevenueCat ya da StoreKit).
- **Sonra:** koç planları, yedek/çok cihaz (Plus), sağlık verisi için KVKK değerlendirmesi.

---

## Dilim 1 — uygulanan yapı

Bu dilimde **hesap, ağ, Supabase, şifreleme, bildirim, Kütüphane, Çevrem/paylaşım yok.** Her şey cihazda, SQLite'ta (`ritos.db`).

### Katmanlar

```
src/
  app/          expo-router ekranları (yalnız arayüz)
    (sekmeler)/   Ajandam (index), Rutinlerim, Ayarlar
    rutin/[id]    rutin detayı
    hosgeldin     ilk açılış (tam ekran modal)
    kart, rutin-duzenle, alanlar, ad   form modalları
  bilesen/      tema (açık/koyu sistemden), ortak parçalar, denge kartı
  mantik/       SAF mantık — veritabanı ve arayüz bilmez, Jest ile test edilir
    tarih.ts        YYYY-MM-DD yardımcıları, hafta başı (pazartesi)
    tekrar.ts       görünürlük, gün sıralaması, tekrar türü, silme planı
    denge.ts        emek / taban / toplam
    rutinDongu.ts   oturdu / arşiv / kuruluyor'a dön planları
    alanlar.ts      8 hazır alan, sıra taşıma
  veri/         SQLite
    sema.ts         migrasyonlar (PRAGMA user_version)
    esleme.ts       satır ↔ nesne (JSON kolonlar, 0/1 → boolean)
    depo.ts         tüm okuma/yazma; tek yazma kapısı `yaz()`
    olay.ts         değişiklik yayını + `useVeri` kancası
```

Mantık modülleri yalnız "ne değişecek"i hesaplar (ör. `oturduPlani` → hangi kartın bitişi değişir, hangileri silinir, rutine hangi kalıplar yazılır); yazmayı `depo.ts` tek bir işlem (transaction) içinde yapar.

### Veri modeli

Ortak kurallar:

- Kimlikler `expo-crypto` `randomUUID()` ile (hazır alanlar hariç: `alan:<kod>`).
- Liste/nesne alanları **JSON metin** kolonudur.
- Her satırda `guncellendi` (epoch ms). Her yazma bunu şimdiye çeker.
- Tarihler yerel saatle `YYYY-MM-DD` metni; haftanın günleri JS `getDay()` (0 = Pazar … 6 = Cumartesi).

#### `yasam_alani`

| kolon | tür | not |
|---|---|---|
| id | TEXT PK | hazırlarda `alan:<kod>` |
| kod | TEXT? | hazır alanın kodu; kullanıcı alanında NULL |
| ad, ikon, aciklama | TEXT | |
| sira | INTEGER | gösterim sırası |
| gizli | INTEGER 0/1 | |
| guncellendi | INTEGER | |

8 hazır alan migrasyonla kurulur (`guncellendi = 0`): hareket 🏃, beslenme 🥗, uyku 😴, zihin 🧠, sosyal 🤝, ogrenme 📚, keyif 🎨, anlam 🧭. Hazır alanlar silinmez, gizlenir. Kullanıcı alanı silinince rutinlerdeki etiketi de kalkar.

#### `rutin` (web'deki ProgramRow'un sadesi)

| kolon | tür | not |
|---|---|---|
| id | TEXT PK | |
| ad, ikon, amac | TEXT | ikon = emoji |
| alanlar | TEXT (JSON `string[]`) | yasam_alani id'leri |
| durum | TEXT | `kuruluyor` \| `oturdu` \| `arsiv` |
| durum_tarih | TEXT | durumun değiştiği gün |
| kaliplar | TEXT (JSON) | oturunca/arşivlenince saklanan kart kalıpları (`id` ve `guncellendi` hariç kart) |
| guncellendi | INTEGER | |

#### `kart` (ajanda kartı)

| kolon | tür | not |
|---|---|---|
| id | TEXT PK | |
| tip | TEXT | `yap` \| `oku` \| `kaydet` \| `uygula` |
| ad | TEXT | |
| aciklama | TEXT | düz metin (bloklar sonra) |
| baslangic | TEXT | YYYY-MM-DD |
| bitis | TEXT? | NULL = süregelen |
| gunler | TEXT? (JSON `number[]`) | NULL = her gün |
| saatler | TEXT (JSON `string[]`) | "HH:MM"; sıralamada ilk saat kullanılır |
| atla | TEXT (JSON `string[]`) | "yalnız bu gün" kaldırılan tarihler |
| rutin_id | TEXT? | NULL = rutinsiz |
| sira | INTEGER | eşit saatte sıra |
| guncellendi | INTEGER | |

Tekrar türleri: **yalnız bu gün** = `baslangic = bitis`, `gunler = NULL`; **her gün** = `gunler = NULL`; **seçili günler** = `gunler = [..]` (7 gün seçilirse her gün sayılır).

#### `kayit`

| kolon | tür | not |
|---|---|---|
| id | TEXT PK | `<kartId>\|<tarih>` |
| kart_id | TEXT | |
| tarih | TEXT | |
| yapildi | INTEGER 0/1 | |
| zaman | INTEGER? | yapıldı işaretlendiği an |
| guncellendi | INTEGER | |

#### Yardımcı tablolar

- `ayar (anahtar PK, deger JSON, guncellendi)` — `ad`, `kurulum_tamam`.
- `silinen (tablo, id, guncellendi)` — silinen her satırın izi. Bu dilimde kullanılmıyor; dilim 2'de bir eşitleme gelirse silmeyi de taşıyabilsin diye şimdiden tutuluyor.

### Kurallar (mantık katmanı)

**Görünürlük:** `baslangic ≤ tarih ≤ bitis` (bitis NULL ise üst sınır yok), `gunler` doluysa haftanın günü listede, ve tarih `atla`da değil. Gün listesi: saatliler saate göre önce, saatsizler sonda, sonra `sira`.

**Tekrar eden kartı silme:**
- *Yalnız bu gün* → tarih `atla`ya eklenir.
- *Bundan sonra* → `bitis` = seçilen günden önceki gün (bugünse dün).
- Kartın görünür günü kalmıyorsa kart (ve kayıtları) tümden silinir.

**Rutin döngüsü:**
- *Oturdu*: rutinin süregelen kartları (bitişi bugünden sonra olan ya da NULL) **bugün biter** (`bitis = bugün`); henüz başlamamış olanlar silinir. Hepsinin özgün kalıbı `kaliplar`a yazılır. Ajandadan yarından itibaren kalkar, dengede taban verir.
- *Arşivle*: aynı şekilde kalkar (oturmuş rutinde kalıplar zaten saklı).
- *Kuruluyor'a dön*: kalıplardan **yarından** (kalıbın başlangıcı daha ilerideyse o günden) başlayan yeni kartlar kurulur; `kaliplar` boşalır.

**Denge** (her görünür alan için 0–4):
- *emek* = son 4 haftanın (bu hafta dahil, pazartesiden başlayan haftalar) kaçında, o alanı etiketleyen bir rutinin kartında en az bir "yapıldı" var. Arşivdeki ve oturmuş rutinlerin geçmiş kayıtları da sayılır.
- *taban* = o alanda "oturdu" durumunda bir rutin varsa 2.
- *toplam* = min(4, emek + taban). Şimdilik yatay çubuklarla; radar grafik sonra.

### Dilim 2'ye hazırlık (kodu yazılmadı)

- Tüm yazmalar `veri/depo.ts` içindeki tek `yaz()` kapısından geçer. Paylaşılan tablolar için "bekleyen listesi"ne (outbox) ekleme ve Supabase'e gönderme buraya bağlanabilir.
- `veri/olay.ts` içindeki `degisti()` yayını, Realtime'dan gelen değişiklikler için de kullanılabilir; ekranlar `useVeri` ile zaten yeniden sorgular.
- Her satırda `guncellendi` var → "son yazan kazanır" ve "son `guncellendi`den sonrasını çek" doğrudan uygulanabilir.
- Kimlikler UUID → sunucu tarafında `uuid` kolonlarına çakışmasız taşınır.
- Kişisel tablolar (yukarıdakiler) sunucuya gitmez; paylaşılan veri ayrı tablolarda (aşağıdaki şema) durur, cihazda yalnız önbellek olarak tutulur.

---

## Dilim 2 için şema taslağı (henüz uygulanmadı)

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  ad text not null default '', avatar_url text,
  guncellendi timestamptz not null default now()
);
create table gruplar (
  id uuid primary key default gen_random_uuid(),
  ad text not null, tur text not null default 'aile' check (tur in ('aile','arkadas','ekip')),
  kurucu uuid not null references profiles on delete cascade,
  olusturuldu timestamptz not null default now()
);
create table grup_uyeleri (
  grup_id uuid references gruplar on delete cascade,
  uye_id uuid references profiles on delete cascade,
  rol text not null default 'uye' check (rol in ('yonetici','uye')),
  durum text not null default 'davet' check (durum in ('davet','aktif','ayrildi')),
  primary key (grup_id, uye_id)
);
create table ortak_listeler (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references gruplar on delete cascade,
  ad text not null, olusturan uuid references profiles on delete set null,
  silindi boolean not null default false, guncellendi timestamptz not null default now()
);
create table ortak_maddeler (
  id uuid primary key default gen_random_uuid(),
  liste_id uuid not null references ortak_listeler on delete cascade,
  grup_id uuid not null references gruplar on delete cascade,   -- RLS ve Realtime süzgeci için
  metin text not null, ekleyen uuid references profiles on delete set null,
  isaretli boolean not null default false, isaret_kim uuid references profiles on delete set null,
  silindi boolean not null default false, guncellendi timestamptz not null default now()
);
create table atanan_kartlar (           -- bir üyenin diğerine verdiği kart (görev)
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references gruplar on delete cascade,
  veren uuid not null references profiles on delete cascade,
  alan uuid not null references profiles on delete cascade,
  kart jsonb not null,                  -- mobil kart biçimi (tip, ad, bloklar, baslangic, bitis, gunler, saatler)
  durum text not null default 'bekliyor' check (durum in ('bekliyor','kabul','ret','bitti')),
  guncellendi timestamptz not null default now()
);
create table kart_kayitlari (           -- atanan kartın gün durumu; veren de görür
  kart_id uuid references atanan_kartlar on delete cascade,
  tarih date not null, yapildi boolean not null default false, degerler jsonb,
  guncellendi timestamptz not null default now(),
  primary key (kart_id, tarih)
);

create function grup_uyesi_mi(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from grup_uyeleri where grup_id = g and uye_id = auth.uid() and durum = 'aktif')
$$;

-- RLS: her tablo açılır; okuma = aynı grubun aktif üyesi; yazma kuralları tabloya göre
-- (profiles: kendi satırı; atanan_kartlar: veren ekler, alan durum günceller; kart_kayitlari: yalnız alan yazar).
-- Realtime: alter publication supabase_realtime add table ortak_maddeler, ortak_listeler, atanan_kartlar, kart_kayitlari, grup_uyeleri;
-- Hesap silme: security definer `hesabimi_sil()` → delete from auth.users where id = auth.uid() (cascade).
```
