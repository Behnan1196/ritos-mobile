import { arsivPlani, kuruluyoraDonPlani, oturduPlani } from './rutinDongu';
import { kart, rutin } from './test-yardim';

const BUGUN = '2026-10-06';

describe('oturduPlani', () => {
  const kartlar = [
    kart({ id: 'surer', baslangic: '2026-09-01', rutin_id: 'r1', saatler: ['07:00'] }),
    kart({ id: 'bitmis', baslangic: '2026-09-01', bitis: '2026-09-30', rutin_id: 'r1' }),
    kart({ id: 'gelecek', baslangic: '2026-10-20', rutin_id: 'r1' }),
    kart({ id: 'bitisli', baslangic: '2026-09-01', bitis: '2026-12-31', rutin_id: 'r1', gunler: [1] }),
  ];
  const p = oturduPlani(rutin(), kartlar, BUGUN);

  test('süregelen kartlar bugün biter, bitmişlere dokunulmaz', () => {
    expect(p.kartGuncelle).toEqual([
      { id: 'surer', bitis: BUGUN },
      { id: 'bitisli', bitis: BUGUN },
    ]);
  });

  test('henüz başlamamış kart silinir', () => {
    expect(p.kartSil).toEqual(['gelecek']);
  });

  test('kalıplar özgün zamanlamayla saklanır', () => {
    expect(p.rutin.durum).toBe('oturdu');
    expect(p.rutin.durum_tarih).toBe(BUGUN);
    expect(p.rutin.kaliplar.map((k) => [k.ad, k.baslangic, k.bitis])).toEqual([
      ['Kart', '2026-09-01', null],
      ['Kart', '2026-10-20', null],
      ['Kart', '2026-09-01', '2026-12-31'],
    ]);
    expect(p.rutin.kaliplar[0]).not.toHaveProperty('id');
    expect(p.rutin.kaliplar[0]?.saatler).toEqual(['07:00']);
  });
});

describe('arsivPlani', () => {
  test('kuruluyor rutin arşivlenince kartlar çekilir', () => {
    const p = arsivPlani(rutin(), [kart({ rutin_id: 'r1' })], BUGUN);
    expect(p.kartGuncelle).toEqual([{ id: 'k1', bitis: BUGUN }]);
    expect(p.rutin.durum).toBe('arsiv');
    expect(p.rutin.kaliplar).toHaveLength(1);
  });

  test('oturmuş rutin arşivlenince kalıplar korunur', () => {
    const r = rutin({ durum: 'oturdu', kaliplar: [{ ...kart(), id: undefined } as never] });
    const p = arsivPlani(r, [], BUGUN);
    expect(p.kartGuncelle).toEqual([]);
    expect(p.rutin.kaliplar).toBe(r.kaliplar);
  });
});

describe('kuruluyoraDonPlani', () => {
  test('kalıplardan yarından başlayan kartlar kurulur', () => {
    const { id: _i, guncellendi: _g, ...k } = kart({ baslangic: '2026-09-01', atla: ['2026-09-10'] });
    const { id: _i2, guncellendi: _g2, ...gelecek } = kart({ baslangic: '2026-11-01', ad: 'Gelecek' });
    const { id: _i3, guncellendi: _g3, ...biten } = kart({ baslangic: '2026-09-01', bitis: '2026-10-06', ad: 'Biten' });
    let n = 0;
    const p = kuruluyoraDonPlani(rutin({ durum: 'oturdu', kaliplar: [k, gelecek, biten] }), BUGUN, () => `yeni${++n}`, 123);
    expect(p.kartEkle.map((x) => [x.id, x.ad, x.baslangic, x.atla, x.rutin_id, x.guncellendi])).toEqual([
      ['yeni1', 'Kart', '2026-10-07', [], 'r1', 123],
      ['yeni2', 'Gelecek', '2026-11-01', [], 'r1', 123],
    ]);
    expect(p.rutin).toEqual({ durum: 'kuruluyor', durum_tarih: BUGUN, kaliplar: [] });
  });
});
