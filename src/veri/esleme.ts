// SQLite satırı ↔ uygulama nesnesi. JSON kolonlar burada açılır/kapanır, 0/1 → boolean.

import type { Kart, Kayit, Rutin, RutinDurum, TemelTip, YasamAlani } from '../mantik/tipler';

export function jsonAc<T>(metin: string | null | undefined, varsayilan: T): T {
  if (metin === null || metin === undefined || metin === '') return varsayilan;
  try {
    return JSON.parse(metin) as T;
  } catch {
    return varsayilan;
  }
}

export interface AlanSatiri { id: string; kod: string | null; ad: string; ikon: string; aciklama: string; sira: number; gizli: number; guncellendi: number }
export interface RutinSatiri { id: string; ad: string; ikon: string; amac: string; alanlar: string; durum: string; durum_tarih: string; kaliplar: string; guncellendi: number }
export interface KartSatiri { id: string; tip: string; ad: string; aciklama: string; baslangic: string; bitis: string | null; gunler: string | null; saatler: string; atla: string; rutin_id: string | null; sira: number; guncellendi: number }
export interface KayitSatiri { id: string; kart_id: string; tarih: string; yapildi: number; zaman: number | null; guncellendi: number }

export const alanAc = (s: AlanSatiri): YasamAlani => ({ ...s, gizli: !!s.gizli });

export const rutinAc = (s: RutinSatiri): Rutin => ({
  ...s,
  durum: s.durum as RutinDurum,
  alanlar: jsonAc<string[]>(s.alanlar, []),
  kaliplar: jsonAc<Rutin['kaliplar']>(s.kaliplar, []),
});

export const kartAc = (s: KartSatiri): Kart => ({
  ...s,
  tip: s.tip as TemelTip,
  gunler: jsonAc<number[] | null>(s.gunler, null),
  saatler: jsonAc<string[]>(s.saatler, []),
  atla: jsonAc<string[]>(s.atla, []),
});

export const kartKapat = (k: Kart): KartSatiri => ({
  ...k,
  gunler: k.gunler === null ? null : JSON.stringify(k.gunler),
  saatler: JSON.stringify(k.saatler),
  atla: JSON.stringify(k.atla),
});

export const kayitAc = (s: KayitSatiri): Kayit => ({ ...s, yapildi: !!s.yapildi });
