import { gorunurAlanlar, hazirAlanSatirlari, siraTasi } from './alanlar';

test('8 hazır alan sabit kimlikle', () => {
  const s = hazirAlanSatirlari();
  expect(s).toHaveLength(8);
  expect(s.map((a) => a.id)).toEqual([
    'alan:hareket', 'alan:beslenme', 'alan:uyku', 'alan:zihin', 'alan:sosyal', 'alan:ogrenme', 'alan:keyif', 'alan:anlam',
  ]);
  expect(s.map((a) => a.ikon).join('')).toBe('🏃🥗😴🧠🤝📚🎨🧭');
});

test('gorunurAlanlar gizlileri çıkarır ve sıralar', () => {
  const s = hazirAlanSatirlari();
  s[0]!.gizli = true;
  s[2]!.sira = 0;
  expect(gorunurAlanlar(s).map((a) => a.kod).slice(0, 2)).toEqual(['uyku', 'beslenme']);
});

test('siraTasi', () => {
  expect(siraTasi(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
  expect(siraTasi(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c']);
});
