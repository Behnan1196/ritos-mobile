// Tekrar mantığı: bir kart hangi günlerde ajandada görünür, gün listesi nasıl sıralanır,
// tekrar eden kart silinirken ne olur. Saf fonksiyonlar — veritabanı ya da arayüz bilmez.

import { tarihEkle, haftaGunu } from './tarih';
import type { Kart } from './tipler';

type Zamanlama = Pick<Kart, 'baslangic' | 'bitis' | 'gunler'>;

/** Zamanlamaya göre o gün etkin mi (atla hariç). */
export function gunEtkin(z: Zamanlama, tarih: string): boolean {
  if (tarih < z.baslangic) return false;
  if (z.bitis !== null && tarih > z.bitis) return false;
  if (z.gunler && z.gunler.length > 0 && z.gunler.length < 7) {
    return z.gunler.includes(haftaGunu(tarih));
  }
  return true;
}

/** Kart o gün ajandada görünür mü: zamanlama + "yalnız bu gün" kaldırılan günler. */
export function gorunur(k: Pick<Kart, 'baslangic' | 'bitis' | 'gunler' | 'atla'>, tarih: string): boolean {
  return gunEtkin(k, tarih) && !k.atla.includes(tarih);
}

/** Saatli kartlar saate göre önce, saatsizler sonda; eşitlikte sira, sonra ad. */
export function kartKarsilastir(a: Kart, b: Kart): number {
  const sa = a.saatler[0] ?? null;
  const sb = b.saatler[0] ?? null;
  if (sa !== null && sb === null) return -1;
  if (sa === null && sb !== null) return 1;
  if (sa !== null && sb !== null && sa !== sb) return sa < sb ? -1 : 1;
  if (a.sira !== b.sira) return a.sira - b.sira;
  return a.ad.localeCompare(b.ad, 'tr');
}

/** O günün kartları, sıralı. */
export function gununKartlari(kartlar: Kart[], tarih: string): Kart[] {
  return kartlar.filter((k) => gorunur(k, tarih)).sort(kartKarsilastir);
}

// ———————————————— Tekrar türü (form ↔ kart) ————————————————

export type TekrarTuru = 'tek' | 'her' | 'gunler';

export function tekrarTuru(k: Zamanlama): TekrarTuru {
  if (k.gunler && k.gunler.length > 0 && k.gunler.length < 7) return 'gunler';
  if (k.bitis !== null && k.bitis === k.baslangic) return 'tek';
  return 'her';
}

/** Tekrar eden kart mı (birden çok güne düşebilir mi)? */
export const tekrarEder = (k: Zamanlama) => tekrarTuru(k) !== 'tek';

/** Formdaki seçimden zamanlama alanları. */
export function zamanlamaKur(
  tur: TekrarTuru,
  baslangic: string,
  gunler: number[],
  bitis: string | null,
): Zamanlama {
  if (tur === 'tek') return { baslangic, bitis: baslangic, gunler: null };
  if (tur === 'gunler') {
    const g = Array.from(new Set(gunler)).sort((a, b) => a - b);
    // Yedi gün seçilmişse "her gün" ile aynı; hiç seçilmemişse de her gün say.
    return { baslangic, bitis, gunler: g.length > 0 && g.length < 7 ? g : null };
  }
  return { baslangic, bitis, gunler: null };
}

// ———————————————— Silme ————————————————

export type SilmeSecimi = 'yalnizBuGun' | 'bundanSonra';

/**
 * Tekrar eden kartı silme planı.
 *  • yalnizBuGun: tarih `atla`ya eklenir.
 *  • bundanSonra: bitis = seçilen günden bir önceki gün (bugünse dün).
 * Kartın görünür günü kalmıyorsa `sil: true` döner — kart tümden silinir.
 */
export function silmePlani(k: Kart, tarih: string, secim: SilmeSecimi): { sil: true } | { sil: false; degisim: Partial<Kart> } {
  if (secim === 'yalnizBuGun') {
    const atla = k.atla.includes(tarih) ? k.atla : [...k.atla, tarih].sort();
    if (!birGunuKalirMi({ ...k, atla })) return { sil: true };
    return { sil: false, degisim: { atla } };
  }
  const bitis = tarihEkle(tarih, -1);
  if (bitis < k.baslangic) return { sil: true };
  const atla = k.atla.filter((t) => t <= bitis);
  if (!birGunuKalirMi({ ...k, bitis, atla })) return { sil: true };
  return { sil: false, degisim: { bitis, atla } };
}

/**
 * Kartın görünür en az bir günü kalıyor mu? Süregelen kart hep kalır.
 * Bitişi olan kartta pencere taranır (en çok bir yıl — daha uzun pencerede gün mutlaka kalır).
 */
export function birGunuKalirMi(k: Pick<Kart, 'baslangic' | 'bitis' | 'gunler' | 'atla'>): boolean {
  if (k.bitis === null) return true;
  if (k.bitis < k.baslangic) return false;
  let t = k.baslangic;
  for (let i = 0; i < 400 && t <= k.bitis; i++) {
    if (gorunur(k, t)) return true;
    t = tarihEkle(t, 1);
  }
  return false;
}

// ———————————————— Özet metni ————————————————

const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const GUN_KISA_ = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const kisaTarih = (t: string) => `${Number(t.slice(8, 10))} ${AY_KISA[Number(t.slice(5, 7)) - 1] ?? ''}`;

/** "Her gün · 07:30", "Pzt, Çar · 31 Ara'ya kadar", "6 Eki" gibi kısa zamanlama özeti. */
export function zamanlamaOzeti(k: Pick<Kart, 'baslangic' | 'bitis' | 'gunler' | 'saatler'>): string {
  const tur = tekrarTuru(k);
  const parcalar: string[] = [];
  if (tur === 'tek') parcalar.push(kisaTarih(k.baslangic));
  else if (tur === 'her') parcalar.push('Her gün');
  else parcalar.push([1, 2, 3, 4, 5, 6, 0].filter((g) => k.gunler!.includes(g)).map((g) => GUN_KISA_[g]).join(', '));
  if (k.saatler.length) parcalar.push(k.saatler.join(', '));
  if (tur !== 'tek' && k.bitis !== null) parcalar.push(`${kisaTarih(k.bitis)} tarihine kadar`);
  return parcalar.join(' · ');
}
