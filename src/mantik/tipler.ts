// Ritos mobil — veri modelinin TypeScript karşılığı (dilim 1).
// SQLite satırları bu biçime çevrilir; JSON kolonlar burada dizi/nesne olarak durur.

export type TemelTip = 'yap' | 'oku' | 'kaydet' | 'uygula';
export const TIPLER: TemelTip[] = ['yap', 'oku', 'kaydet', 'uygula'];
export const TIP_ETIKET: Record<TemelTip, string> = {
  yap: 'Yap',
  oku: 'Oku',
  kaydet: 'Kaydet',
  uygula: 'Uygula',
};

export interface YasamAlani {
  id: string; // hazırlarda `alan:<kod>`, kullanıcınınkilerde uuid
  kod: string | null; // hazır alanın kodu; kullanıcı alanında null
  ad: string;
  ikon: string;
  aciklama: string;
  sira: number;
  gizli: boolean;
  guncellendi: number;
}

export type RutinDurum = 'kuruluyor' | 'oturdu' | 'arsiv';

/** Rutin oturunca ya da arşivlenince kartlarından saklanan kalıp. */
export type KartKalibi = Omit<Kart, 'id' | 'guncellendi'>;

export interface Rutin {
  id: string;
  ad: string;
  ikon: string; // emoji
  amac: string;
  alanlar: string[]; // yasam_alani id'leri
  durum: RutinDurum;
  durum_tarih: string; // YYYY-MM-DD
  kaliplar: KartKalibi[];
  guncellendi: number;
}

export interface Kart {
  id: string;
  tip: TemelTip;
  ad: string;
  aciklama: string;
  baslangic: string; // YYYY-MM-DD
  bitis: string | null; // null = süregelen
  gunler: number[] | null; // 0=Paz..6=Cmt; null = her gün
  saatler: string[]; // "HH:MM"
  atla: string[]; // "yalnız bu gün" kaldırılan tarihler
  rutin_id: string | null;
  sira: number;
  guncellendi: number;
}

export interface Kayit {
  id: string; // `${kart_id}|${tarih}`
  kart_id: string;
  tarih: string;
  yapildi: boolean;
  zaman: number | null; // yapıldı işaretlendiği an (epoch ms)
  guncellendi: number;
}

export const kayitId = (kartId: string, tarih: string) => `${kartId}|${tarih}`;
