import { jsonAc, kartAc, kartKapat, rutinAc } from './esleme';
import { kart } from '../mantik/test-yardim';

test('kart gidiş-dönüş', () => {
  const k = kart({ gunler: [1, 3], saatler: ['07:00'], atla: ['2026-10-06'], bitis: null });
  expect(kartAc(kartKapat(k))).toEqual(k);
  expect(kartKapat(kart({ gunler: null })).gunler).toBeNull();
});

test('bozuk JSON varsayılana düşer', () => {
  expect(jsonAc('{bozuk', [])).toEqual([]);
  expect(jsonAc(null, 5)).toBe(5);
  const r = rutinAc({ id: 'r', ad: 'R', ikon: '🌱', amac: '', alanlar: 'x', durum: 'oturdu', durum_tarih: '2026-10-06', kaliplar: '[]', guncellendi: 1 });
  expect(r.alanlar).toEqual([]);
});
