// Denge: her görünür yaşam alanı için 0–4 puan.
//  • emek  = son 4 haftanın (bu hafta dahil, pazartesiden başlayan) kaçında, o alanı etiketleyen
//            bir rutinin kartında en az bir "yapıldı" var.
//  • taban = o alanda "oturdu" durumunda bir rutin varsa 2.
//  • toplam = min(4, emek + taban).

import { haftaBasi, tarihEkle, gunFarki } from './tarih';
import type { Kart, Kayit, Rutin, YasamAlani } from './tipler';

export const HAFTA_SAYISI = 4;
export const TABAN = 2;
export const EN_COK = 4;

export interface AlanDenge {
  alan: YasamAlani;
  /** Son 4 hafta (eskiden yeniye) yapılan kayıt sayısı. */
  hafta: number[];
  emek: number;
  taban: number;
  toplam: number;
  oturan: string[]; // tabanı veren rutinlerin adları
}

export function dengeHesapla(
  alanlar: YasamAlani[],
  rutinler: Rutin[],
  kartlar: Pick<Kart, 'id' | 'rutin_id'>[],
  kayitlar: Pick<Kayit, 'kart_id' | 'tarih' | 'yapildi'>[],
  bugun: string,
): AlanDenge[] {
  const bas = tarihEkle(haftaBasi(bugun), -7 * (HAFTA_SAYISI - 1));
  const rutinAlan = new Map(rutinler.map((r) => [r.id, r.alanlar]));
  const kartAlan = new Map<string, string[]>();
  for (const k of kartlar) {
    const a = k.rutin_id ? rutinAlan.get(k.rutin_id) : undefined;
    if (a && a.length) kartAlan.set(k.id, a);
  }

  const sayac = new Map<string, number[]>();
  for (const r of kayitlar) {
    if (!r.yapildi || r.tarih < bas || r.tarih > bugun) continue;
    const al = kartAlan.get(r.kart_id);
    if (!al) continue;
    const hi = Math.min(HAFTA_SAYISI - 1, Math.floor(gunFarki(bas, r.tarih) / 7));
    for (const a of al) {
      const h = sayac.get(a) ?? Array<number>(HAFTA_SAYISI).fill(0);
      h[hi] = (h[hi] ?? 0) + 1;
      sayac.set(a, h);
    }
  }

  return alanlar
    .filter((a) => !a.gizli)
    .sort((a, b) => a.sira - b.sira)
    .map((alan) => {
      const hafta = sayac.get(alan.id) ?? Array<number>(HAFTA_SAYISI).fill(0);
      const emek = hafta.filter((n) => n > 0).length;
      const oturan = rutinler.filter((r) => r.durum === 'oturdu' && r.alanlar.includes(alan.id)).map((r) => r.ad);
      const taban = oturan.length ? TABAN : 0;
      return { alan, hafta, emek, taban, toplam: Math.min(EN_COK, emek + taban), oturan };
    });
}
