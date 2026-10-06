import { gecerliTarih, goreceliGun, gunFarki, haftaBasi, saatDuzelt, tarihEkle, tarihEtiket } from './tarih';

describe('tarih', () => {
  test('tarihEkle ay ve yıl sınırını geçer', () => {
    expect(tarihEkle('2026-10-31', 1)).toBe('2026-11-01');
    expect(tarihEkle('2026-01-01', -1)).toBe('2025-12-31');
    expect(tarihEkle('2028-02-28', 1)).toBe('2028-02-29');
  });

  test('gunFarki', () => {
    expect(gunFarki('2026-10-01', '2026-10-08')).toBe(7);
    expect(gunFarki('2026-10-08', '2026-10-01')).toBe(-7);
  });

  test('haftaBasi pazartesidir', () => {
    expect(haftaBasi('2026-10-06')).toBe('2026-10-05'); // salı → pazartesi
    expect(haftaBasi('2026-10-05')).toBe('2026-10-05');
    expect(haftaBasi('2026-10-11')).toBe('2026-10-05'); // pazar
  });

  test('gecerliTarih', () => {
    expect(gecerliTarih('2026-02-29')).toBe(false);
    expect(gecerliTarih('2026-12-31')).toBe(true);
    expect(gecerliTarih('2026-1-3')).toBe(false);
  });

  test('saatDuzelt', () => {
    expect(saatDuzelt('9:5')).toBe('09:05');
    expect(saatDuzelt('0930')).toBe('09:30');
    expect(saatDuzelt('7')).toBe('07:00');
    expect(saatDuzelt('21.15')).toBe('21:15');
    expect(saatDuzelt('25:00')).toBeNull();
    expect(saatDuzelt('abc')).toBeNull();
  });

  test('etiketler', () => {
    expect(tarihEtiket('2026-10-06')).toBe('6 Ekim, Salı');
    expect(goreceliGun('2026-10-05', '2026-10-06')).toBe('Dün');
    expect(goreceliGun('2026-10-06', '2026-10-06')).toBe('Bugün');
    expect(goreceliGun('2026-10-07', '2026-10-06')).toBe('Yarın');
    expect(goreceliGun('2026-10-09', '2026-10-06')).toBeNull();
  });
});
