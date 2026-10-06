// Testler için kısa kurucular.
import type { Kart, Rutin, YasamAlani } from './tipler';

export function kart(p: Partial<Kart> = {}): Kart {
  return {
    id: 'k1', tip: 'yap', ad: 'Kart', aciklama: '', baslangic: '2026-10-01', bitis: null, gunler: null,
    saatler: [], atla: [], rutin_id: null, sira: 0, guncellendi: 0, ...p,
  };
}

export function rutin(p: Partial<Rutin> = {}): Rutin {
  return {
    id: 'r1', ad: 'Rutin', ikon: '🌱', amac: '', alanlar: [], durum: 'kuruluyor', durum_tarih: '2026-10-01',
    kaliplar: [], guncellendi: 0, ...p,
  };
}

export function alan(p: Partial<YasamAlani> = {}): YasamAlani {
  return { id: 'alan:hareket', kod: 'hareket', ad: 'Hareket', ikon: '🏃', aciklama: '', sira: 1, gizli: false, guncellendi: 0, ...p };
}
