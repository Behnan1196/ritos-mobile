// Hazır yaşam alanları. Kimlikleri sabittir (`alan:<kod>`); silinmez, gizlenir.

import type { YasamAlani } from './tipler';

export const HAZIR_ALANLAR: { kod: string; ad: string; ikon: string; aciklama: string }[] = [
  { kod: 'hareket', ad: 'Hareket', ikon: '🏃', aciklama: 'egzersiz, yürüyüş, esneme' },
  { kod: 'beslenme', ad: 'Beslenme', ikon: '🥗', aciklama: 'öğünler, su, mutfak' },
  { kod: 'uyku', ad: 'Uyku', ikon: '😴', aciklama: 'uyku düzeni, dinlenme' },
  { kod: 'zihin', ad: 'Zihin', ikon: '🧠', aciklama: 'nefes, meditasyon, stres' },
  { kod: 'sosyal', ad: 'Sosyal bağlar', ikon: '🤝', aciklama: 'aile, arkadaşlar, birlikte vakit' },
  { kod: 'ogrenme', ad: 'Öğrenme', ikon: '📚', aciklama: 'okuma, kurs, beceri' },
  { kod: 'keyif', ad: 'Keyif', ikon: '🎨', aciklama: 'hobi, oyun, yaratıcılık' },
  { kod: 'anlam', ad: 'Anlam', ikon: '🧭', aciklama: 'değerler, katkı, gönüllülük' },
];

export const hazirId = (kod: string) => `alan:${kod}`;

/** Hazır alanların ilk kurulum satırları (guncellendi 0: hiç değişmemiş varsayılan). */
export function hazirAlanSatirlari(): YasamAlani[] {
  return HAZIR_ALANLAR.map((h, i) => ({
    id: hazirId(h.kod),
    kod: h.kod,
    ad: h.ad,
    ikon: h.ikon,
    aciklama: h.aciklama,
    sira: i + 1,
    gizli: false,
    guncellendi: 0,
  }));
}

export const ALAN_IKONLARI = ['🏃', '🥗', '😴', '🧠', '🤝', '📚', '🎨', '🧭', '💼', '💰', '🏡', '🌿', '🙏', '❤️', '🧘', '🎵', '✈️', '🐾', '👶', '🛠️'];
export const RUTIN_IKONLARI = ['🌱', '🏃', '🧘', '💧', '🥗', '😴', '📚', '✍️', '🎸', '🎨', '🤝', '🧹', '💊', '🚶', '🌅', '🙏', '💪', '🧠', '🐾', '☕'];

/** Görünür alanlar, sıralı. */
export const gorunurAlanlar = (alanlar: YasamAlani[]) => alanlar.filter((a) => !a.gizli).sort((a, b) => a.sira - b.sira);

/** Bir alanı yukarı (-1) ya da aşağı (+1) taşıyınca yeni sıra (id listesi). */
export function siraTasi(idler: string[], id: string, yon: -1 | 1): string[] {
  const i = idler.indexOf(id);
  const j = i + yon;
  if (i < 0 || j < 0 || j >= idler.length) return idler;
  const yeni = [...idler];
  [yeni[i], yeni[j]] = [yeni[j]!, yeni[i]!];
  return yeni;
}
