import { dengeHesapla } from './denge';
import { alan, kart, rutin } from './test-yardim';

const BUGUN = '2026-10-06'; // salı; bu haftanın pazartesisi 2026-10-05, 4 hafta 2026-09-14'ten başlar

const alanlar = [
  alan({ id: 'alan:hareket', sira: 1 }),
  alan({ id: 'alan:uyku', kod: 'uyku', ad: 'Uyku', sira: 2 }),
  alan({ id: 'alan:keyif', kod: 'keyif', ad: 'Keyif', sira: 3, gizli: true }),
];

const yap = (kart_id: string, tarih: string, yapildi = true) => ({ kart_id, tarih, yapildi });

describe('dengeHesapla', () => {
  test('gizli alanlar dışarıda kalır', () => {
    const d = dengeHesapla(alanlar, [], [], [], BUGUN);
    expect(d.map((x) => x.alan.id)).toEqual(['alan:hareket', 'alan:uyku']);
    expect(d.every((x) => x.toplam === 0)).toBe(true);
  });

  test('emek: yapılan hafta sayısı (haftada birden çok yapılan bir sayılır)', () => {
    const rutinler = [rutin({ id: 'r1', alanlar: ['alan:hareket'] })];
    const kartlar = [kart({ id: 'k1', rutin_id: 'r1' }), kart({ id: 'k2', rutin_id: null })];
    const kayitlar = [
      yap('k1', '2026-09-14'), // 1. hafta
      yap('k1', '2026-09-15'), // 1. hafta yine
      yap('k1', '2026-10-05'), // bu hafta
      yap('k1', '2026-09-22', false), // yapılmadı
      yap('k1', '2026-09-13'), // pencerenin dışında
      yap('k1', '2026-10-07'), // gelecekte
      yap('k2', '2026-09-29'), // rutinsiz kart
    ];
    const [hareket, uyku] = dengeHesapla(alanlar, rutinler, kartlar, kayitlar, BUGUN);
    expect(hareket?.hafta).toEqual([2, 0, 0, 1]);
    expect(hareket?.emek).toBe(2);
    expect(hareket?.toplam).toBe(2);
    expect(uyku?.emek).toBe(0);
  });

  test('taban: oturmuş rutin 2 verir, toplam 4 ile sınırlı', () => {
    const rutinler = [
      rutin({ id: 'r1', alanlar: ['alan:hareket'] }),
      rutin({ id: 'r2', ad: 'Yürüyüş', alanlar: ['alan:hareket', 'alan:uyku'], durum: 'oturdu' }),
    ];
    const kartlar = [kart({ id: 'k1', rutin_id: 'r1' })];
    const kayitlar = ['2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05'].map((t) => yap('k1', t));
    const [hareket, uyku] = dengeHesapla(alanlar, rutinler, kartlar, kayitlar, BUGUN);
    expect(hareket).toMatchObject({ emek: 4, taban: 2, toplam: 4, oturan: ['Yürüyüş'] });
    expect(uyku).toMatchObject({ emek: 0, taban: 2, toplam: 2 });
  });

  test('arşivdeki rutinin geçmiş kayıtları emeğe sayılır ama taban vermez', () => {
    const rutinler = [rutin({ id: 'r1', alanlar: ['alan:uyku'], durum: 'arsiv' })];
    const d = dengeHesapla(alanlar, rutinler, [kart({ id: 'k1', rutin_id: 'r1' })], [yap('k1', '2026-09-30')], BUGUN);
    expect(d[1]).toMatchObject({ emek: 1, taban: 0, toplam: 1 });
  });
});
