import { birGunuKalirMi, gorunur, gununKartlari, silmePlani, tekrarTuru, zamanlamaKur } from './tekrar';
import { kart } from './test-yardim';

describe('gorunur', () => {
  test('başlangıçtan önce ve bitişten sonra görünmez', () => {
    const k = kart({ baslangic: '2026-10-05', bitis: '2026-10-10' });
    expect(gorunur(k, '2026-10-04')).toBe(false);
    expect(gorunur(k, '2026-10-05')).toBe(true);
    expect(gorunur(k, '2026-10-10')).toBe(true);
    expect(gorunur(k, '2026-10-11')).toBe(false);
  });

  test('süregelen kart hep görünür', () => {
    expect(gorunur(kart({ baslangic: '2026-01-01' }), '2030-05-05')).toBe(true);
  });

  test('haftanın günleri', () => {
    const k = kart({ baslangic: '2026-10-01', gunler: [1, 3] }); // pzt, çar
    expect(gorunur(k, '2026-10-05')).toBe(true); // pazartesi
    expect(gorunur(k, '2026-10-06')).toBe(false); // salı
    expect(gorunur(k, '2026-10-07')).toBe(true); // çarşamba
  });

  test('yedi gün ya da boş liste her gün demektir', () => {
    expect(gorunur(kart({ gunler: [0, 1, 2, 3, 4, 5, 6] }), '2026-10-06')).toBe(true);
    expect(gorunur(kart({ gunler: [] }), '2026-10-06')).toBe(true);
  });

  test('atla listesindeki gün görünmez', () => {
    const k = kart({ atla: ['2026-10-06'] });
    expect(gorunur(k, '2026-10-06')).toBe(false);
    expect(gorunur(k, '2026-10-07')).toBe(true);
  });
});

describe('gununKartlari', () => {
  test('saatliler saate göre önce, saatsizler sonda', () => {
    const liste = gununKartlari(
      [
        kart({ id: 'a', ad: 'Saatsiz', sira: 0 }),
        kart({ id: 'b', ad: 'Akşam', saatler: ['20:00'] }),
        kart({ id: 'c', ad: 'Sabah', saatler: ['07:30'] }),
        kart({ id: 'd', ad: 'Bitmiş', bitis: '2026-10-02' }),
        kart({ id: 'e', ad: 'Saatsiz 2', sira: 1 }),
      ],
      '2026-10-06',
    );
    expect(liste.map((k) => k.id)).toEqual(['c', 'b', 'a', 'e']);
  });
});

describe('tekrar türü', () => {
  test('tek gün', () => {
    expect(tekrarTuru(kart({ baslangic: '2026-10-06', bitis: '2026-10-06' }))).toBe('tek');
    expect(zamanlamaKur('tek', '2026-10-06', [], '2026-12-01')).toEqual({ baslangic: '2026-10-06', bitis: '2026-10-06', gunler: null });
  });
  test('her gün', () => {
    expect(tekrarTuru(kart({ bitis: null }))).toBe('her');
    expect(tekrarTuru(kart({ bitis: '2026-12-01' }))).toBe('her');
  });
  test('seçili günler', () => {
    expect(tekrarTuru(kart({ gunler: [2, 4] }))).toBe('gunler');
    expect(zamanlamaKur('gunler', '2026-10-06', [4, 2, 2], null)).toEqual({ baslangic: '2026-10-06', bitis: null, gunler: [2, 4] });
    expect(zamanlamaKur('gunler', '2026-10-06', [0, 1, 2, 3, 4, 5, 6], null).gunler).toBeNull();
  });
});

describe('silmePlani', () => {
  test('yalnız bu gün → atla', () => {
    const p = silmePlani(kart({ baslangic: '2026-10-01' }), '2026-10-06', 'yalnizBuGun');
    expect(p).toEqual({ sil: false, degisim: { atla: ['2026-10-06'] } });
  });

  test('bundan sonra → bitis = önceki gün', () => {
    const p = silmePlani(kart({ baslangic: '2026-10-01', atla: ['2026-10-03', '2026-10-09'] }), '2026-10-06', 'bundanSonra');
    expect(p).toEqual({ sil: false, degisim: { bitis: '2026-10-05', atla: ['2026-10-03'] } });
  });

  test('bundan sonra başlangıç gününde seçilirse kart tümden silinir', () => {
    expect(silmePlani(kart({ baslangic: '2026-10-06' }), '2026-10-06', 'bundanSonra')).toEqual({ sil: true });
  });

  test('son görünür gün de atlanırsa kart silinir', () => {
    const k = kart({ baslangic: '2026-10-05', bitis: '2026-10-06', atla: ['2026-10-05'] });
    expect(silmePlani(k, '2026-10-06', 'yalnizBuGun')).toEqual({ sil: true });
  });

  test('birGunuKalirMi', () => {
    expect(birGunuKalirMi(kart({ baslangic: '2026-10-06', bitis: '2026-10-05' }))).toBe(false);
    // salı–pazartesi arası yalnız cumartesi: pencere içinde bir cumartesi var
    expect(birGunuKalirMi(kart({ baslangic: '2026-10-06', bitis: '2026-10-12', gunler: [6] }))).toBe(true);
    expect(birGunuKalirMi(kart({ baslangic: '2026-10-06', bitis: '2026-10-08', gunler: [6] }))).toBe(false);
  });
});
