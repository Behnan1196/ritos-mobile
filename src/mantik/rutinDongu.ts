// Rutin yaşam döngüsü: Kuruluyor → Oturdu → (Kuruluyor'a dönüş) · Arşiv.
//  • Oturdu / Arşiv: rutinin süregelen kartları bugün biter (bitis = bugün); kalıpları rutinde saklanır.
//    Böylece yarından itibaren ajandadan kalkar, geçmiş ve bugün yerinde kalır.
//  • Kuruluyor'a dön: kalıplardan yarından başlayan yeni kartlar kurulur.
// Saf fonksiyonlar: yalnız yapılacak değişikliği hesaplar, yazmayı veri katmanı yapar.

import { tarihEkle } from './tarih';
import { birGunuKalirMi } from './tekrar';
import type { Kart, KartKalibi, Rutin, RutinDurum } from './tipler';

export const DURUM_ETIKET: Record<RutinDurum, string> = {
  kuruluyor: 'Kuruluyor',
  oturdu: 'Oturdu',
  arsiv: 'Arşiv',
};

export interface DonguPlani {
  /** Bitişi değişecek kartlar. */
  kartGuncelle: { id: string; bitis: string }[];
  /** Henüz başlamamış, bu yüzden tümden kalkacak kartlar. */
  kartSil: string[];
  /** Yeni kurulacak kartlar. */
  kartEkle: Kart[];
  rutin: Pick<Rutin, 'durum' | 'durum_tarih' | 'kaliplar'>;
}

/** Bugünden sonra hâlâ görünecek kart mı? */
const surer = (k: Kart, bugun: string) => k.bitis === null || k.bitis > bugun;

function kalip(k: Kart): KartKalibi {
  const { id: _id, guncellendi: _g, ...geri } = k;
  return geri;
}

/** Süregelen kartları bugün bitirir; kalıplarını döner. */
function kartlariCek(kartlar: Kart[], bugun: string) {
  const surenler = kartlar.filter((k) => surer(k, bugun));
  const kartGuncelle: DonguPlani['kartGuncelle'] = [];
  const kartSil: string[] = [];
  for (const k of surenler) {
    if (k.baslangic > bugun) kartSil.push(k.id);
    else kartGuncelle.push({ id: k.id, bitis: bugun });
  }
  return { kartGuncelle, kartSil, kaliplar: surenler.map(kalip) };
}

/** Rutin "oturdu": kartlar bugün biter, kalıplar saklanır. */
export function oturduPlani(rutin: Rutin, kartlar: Kart[], bugun: string): DonguPlani {
  const { kartGuncelle, kartSil, kaliplar } = kartlariCek(kartlar, bugun);
  return { kartGuncelle, kartSil, kartEkle: [], rutin: { durum: 'oturdu', durum_tarih: bugun, kaliplar } };
}

/** Rutin "arşiv": oturmuşsa kalıplar zaten saklı; kuruluyorsa önce kartlar çekilir. */
export function arsivPlani(rutin: Rutin, kartlar: Kart[], bugun: string): DonguPlani {
  if (rutin.durum === 'oturdu' || rutin.durum === 'arsiv') {
    return { kartGuncelle: [], kartSil: [], kartEkle: [], rutin: { durum: 'arsiv', durum_tarih: bugun, kaliplar: rutin.kaliplar } };
  }
  const { kartGuncelle, kartSil, kaliplar } = kartlariCek(kartlar, bugun);
  return { kartGuncelle, kartSil, kartEkle: [], rutin: { durum: 'arsiv', durum_tarih: bugun, kaliplar } };
}

/** Kuruluyor'a dön: kalıplardan yarından başlayan yeni kartlar. */
export function kuruluyoraDonPlani(rutin: Rutin, bugun: string, yeniId: () => string, simdi: number): DonguPlani {
  const yarin = tarihEkle(bugun, 1);
  const kartEkle: Kart[] = [];
  for (const k of rutin.kaliplar) {
    const baslangic = k.baslangic > yarin ? k.baslangic : yarin;
    const aday = { ...k, baslangic, atla: [] as string[], rutin_id: rutin.id };
    if (!birGunuKalirMi(aday)) continue;
    kartEkle.push({ ...aday, id: yeniId(), guncellendi: simdi });
  }
  return { kartGuncelle: [], kartSil: [], kartEkle, rutin: { durum: 'kuruluyor', durum_tarih: bugun, kaliplar: [] } };
}

/** Rutinlerim listesindeki bölüm sırası. */
export const DURUM_SIRASI: RutinDurum[] = ['kuruluyor', 'oturdu', 'arsiv'];
