// Veri katmanı: ekranların kullandığı tüm okuma/yazma işlemleri burada.
// Her yazma `guncellendi`yi şimdiye çeker, silmeler `silinen` tablosuna iz bırakır ve
// sonunda `degisti()` yayınlanır. Dilim 2'de eşitleme bu tek kapıya bağlanacak.

import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { gorunurAlanlar } from '../mantik/alanlar';
import { HAFTA_SAYISI } from '../mantik/denge';
import { arsivPlani, kuruluyoraDonPlani, oturduPlani, type DonguPlani } from '../mantik/rutinDongu';
import { bugun, haftaBasi, tarihEkle } from '../mantik/tarih';
import { silmePlani, type SilmeSecimi } from '../mantik/tekrar';
import { kayitId, type Kart, type Kayit, type Rutin, type YasamAlani } from '../mantik/tipler';
import { vt } from './db';
import {
  alanAc, kartAc, kartKapat, kayitAc, rutinAc, jsonAc,
  type AlanSatiri, type KartSatiri, type KayitSatiri, type RutinSatiri,
} from './esleme';
import { degisti } from './olay';
import { semayiSifirla } from './sema';

export const yeniId = () => randomUUID();

/** Yazma işlemlerini bir işlemde toplar ve sonunda değişikliği duyurur. */
async function yaz(is: (db: SQLiteDatabase, simdi: number) => Promise<void>): Promise<void> {
  const db = await vt();
  const simdi = Date.now();
  await db.withTransactionAsync(() => is(db, simdi));
  degisti();
}

async function izBirak(db: SQLiteDatabase, tablo: string, id: string, simdi: number) {
  await db.runAsync('INSERT OR REPLACE INTO silinen (tablo, id, guncellendi) VALUES (?, ?, ?)', [tablo, id, simdi]);
}

// ———————————————— Ayarlar ————————————————

export const AYAR = { ad: 'ad', kurulumTamam: 'kurulum_tamam' } as const;

export async function ayarOku<T>(anahtar: string, varsayilan: T): Promise<T> {
  const db = await vt();
  const s = await db.getFirstAsync<{ deger: string }>('SELECT deger FROM ayar WHERE anahtar = ?', [anahtar]);
  return s ? jsonAc<T>(s.deger, varsayilan) : varsayilan;
}

async function ayarYazDb(db: SQLiteDatabase, anahtar: string, deger: unknown, simdi: number) {
  await db.runAsync('INSERT OR REPLACE INTO ayar (anahtar, deger, guncellendi) VALUES (?, ?, ?)', [anahtar, JSON.stringify(deger), simdi]);
}

export function ayarYaz(anahtar: string, deger: unknown) {
  return yaz((db, simdi) => ayarYazDb(db, anahtar, deger, simdi));
}

// ———————————————— Yaşam alanları ————————————————

export async function alanlariGetir(): Promise<YasamAlani[]> {
  const db = await vt();
  return (await db.getAllAsync<AlanSatiri>('SELECT * FROM yasam_alani ORDER BY sira, ad')).map(alanAc);
}

/** İlk açılış: seçilen alanlar görünür, diğerleri gizli; ad kaydedilir. */
export function kurulumuTamamla(seciliAlanlar: string[], ad: string) {
  return yaz(async (db, simdi) => {
    const hepsi = await db.getAllAsync<{ id: string }>('SELECT id FROM yasam_alani');
    for (const { id } of hepsi) {
      await db.runAsync('UPDATE yasam_alani SET gizli = ?, guncellendi = ? WHERE id = ?', [seciliAlanlar.includes(id) ? 0 : 1, simdi, id]);
    }
    await ayarYazDb(db, AYAR.ad, ad.trim(), simdi);
    await ayarYazDb(db, AYAR.kurulumTamam, true, simdi);
  });
}

export function alanGizle(id: string, gizli: boolean) {
  return yaz((db, simdi) => db.runAsync('UPDATE yasam_alani SET gizli = ?, guncellendi = ? WHERE id = ?', [gizli ? 1 : 0, simdi, id]).then(() => undefined));
}

export function alanSirala(idler: string[]) {
  return yaz(async (db, simdi) => {
    for (let i = 0; i < idler.length; i++) {
      await db.runAsync('UPDATE yasam_alani SET sira = ?, guncellendi = ? WHERE id = ?', [i + 1, simdi, idler[i]!]);
    }
  });
}

export function alanEkle(ad: string, ikon: string) {
  return yaz(async (db, simdi) => {
    const s = await db.getFirstAsync<{ m: number | null }>('SELECT MAX(sira) AS m FROM yasam_alani');
    await db.runAsync(
      'INSERT INTO yasam_alani (id, kod, ad, ikon, aciklama, sira, gizli, guncellendi) VALUES (?, NULL, ?, ?, \'\', ?, 0, ?)',
      [yeniId(), ad.trim(), ikon, (s?.m ?? 0) + 1, simdi],
    );
  });
}

/** Yalnız kullanıcının eklediği alan silinir; rutinlerdeki etiketi de kalkar. Hazır alanlar gizlenir. */
export function alanSil(id: string) {
  return yaz(async (db, simdi) => {
    const a = await db.getFirstAsync<AlanSatiri>('SELECT * FROM yasam_alani WHERE id = ?', [id]);
    if (!a || a.kod) return;
    for (const r of (await db.getAllAsync<RutinSatiri>('SELECT * FROM rutin')).map(rutinAc)) {
      if (r.alanlar.includes(id)) {
        await db.runAsync('UPDATE rutin SET alanlar = ?, guncellendi = ? WHERE id = ?', [JSON.stringify(r.alanlar.filter((x) => x !== id)), simdi, r.id]);
      }
    }
    await db.runAsync('DELETE FROM yasam_alani WHERE id = ?', [id]);
    await izBirak(db, 'yasam_alani', id, simdi);
  });
}

// ———————————————— Rutinler ————————————————

export async function rutinleriGetir(): Promise<Rutin[]> {
  const db = await vt();
  return (await db.getAllAsync<RutinSatiri>('SELECT * FROM rutin ORDER BY ad COLLATE NOCASE')).map(rutinAc);
}

export async function rutinGetir(id: string): Promise<Rutin | null> {
  const db = await vt();
  const s = await db.getFirstAsync<RutinSatiri>('SELECT * FROM rutin WHERE id = ?', [id]);
  return s ? rutinAc(s) : null;
}

export type RutinGirdi = Pick<Rutin, 'ad' | 'ikon' | 'amac' | 'alanlar'>;

/** Yeni rutin kurar (id yoksa) ya da var olanın bilgilerini günceller. Kimliği döner. */
export async function rutinKaydet(girdi: RutinGirdi, id?: string): Promise<string> {
  const rid = id ?? yeniId();
  await yaz(async (db, simdi) => {
    if (id) {
      await db.runAsync('UPDATE rutin SET ad = ?, ikon = ?, amac = ?, alanlar = ?, guncellendi = ? WHERE id = ?', [
        girdi.ad.trim(), girdi.ikon, girdi.amac.trim(), JSON.stringify(girdi.alanlar), simdi, id,
      ]);
    } else {
      await db.runAsync(
        "INSERT INTO rutin (id, ad, ikon, amac, alanlar, durum, durum_tarih, kaliplar, guncellendi) VALUES (?, ?, ?, ?, ?, 'kuruluyor', ?, '[]', ?)",
        [rid, girdi.ad.trim(), girdi.ikon, girdi.amac.trim(), JSON.stringify(girdi.alanlar), bugun(), simdi],
      );
    }
  });
  return rid;
}

/** Rutini, kartlarını ve kartların kayıtlarını siler. */
export function rutinSil(id: string) {
  return yaz(async (db, simdi) => {
    const kartlar = await db.getAllAsync<{ id: string }>('SELECT id FROM kart WHERE rutin_id = ?', [id]);
    for (const k of kartlar) await kartSilDb(db, k.id, simdi);
    await db.runAsync('DELETE FROM rutin WHERE id = ?', [id]);
    await izBirak(db, 'rutin', id, simdi);
  });
}

async function planUygula(db: SQLiteDatabase, rutinId: string, plan: DonguPlani, simdi: number) {
  for (const g of plan.kartGuncelle) {
    await db.runAsync('UPDATE kart SET bitis = ?, guncellendi = ? WHERE id = ?', [g.bitis, simdi, g.id]);
  }
  for (const id of plan.kartSil) await kartSilDb(db, id, simdi);
  for (const k of plan.kartEkle) await kartYazDb(db, k);
  await db.runAsync('UPDATE rutin SET durum = ?, durum_tarih = ?, kaliplar = ?, guncellendi = ? WHERE id = ?', [
    plan.rutin.durum, plan.rutin.durum_tarih, JSON.stringify(plan.rutin.kaliplar), simdi, rutinId,
  ]);
}

async function rutinVeKartlari(db: SQLiteDatabase, id: string) {
  const s = await db.getFirstAsync<RutinSatiri>('SELECT * FROM rutin WHERE id = ?', [id]);
  if (!s) return null;
  const kartlar = (await db.getAllAsync<KartSatiri>('SELECT * FROM kart WHERE rutin_id = ? ORDER BY sira', [id])).map(kartAc);
  return { rutin: rutinAc(s), kartlar };
}

export function rutinOturdu(id: string) {
  return yaz(async (db, simdi) => {
    const v = await rutinVeKartlari(db, id);
    if (v) await planUygula(db, id, oturduPlani(v.rutin, v.kartlar, bugun()), simdi);
  });
}

export function rutinArsivle(id: string) {
  return yaz(async (db, simdi) => {
    const v = await rutinVeKartlari(db, id);
    if (v) await planUygula(db, id, arsivPlani(v.rutin, v.kartlar, bugun()), simdi);
  });
}

export function rutinKuruluyoraDon(id: string) {
  return yaz(async (db, simdi) => {
    const v = await rutinVeKartlari(db, id);
    if (v) await planUygula(db, id, kuruluyoraDonPlani(v.rutin, bugun(), yeniId, simdi), simdi);
  });
}

// ———————————————— Kartlar ————————————————

export async function kartGetir(id: string): Promise<Kart | null> {
  const db = await vt();
  const s = await db.getFirstAsync<KartSatiri>('SELECT * FROM kart WHERE id = ?', [id]);
  return s ? kartAc(s) : null;
}

/** O güne düşebilecek kartlar (tarih penceresi SQL'de, gün/atla süzgeci mantık katmanında). */
export async function tarihKartlari(tarih: string): Promise<Kart[]> {
  const db = await vt();
  return (await db.getAllAsync<KartSatiri>('SELECT * FROM kart WHERE baslangic <= ? AND (bitis IS NULL OR bitis >= ?)', [tarih, tarih])).map(kartAc);
}

export async function rutinKartlari(rutinId: string): Promise<Kart[]> {
  const db = await vt();
  return (await db.getAllAsync<KartSatiri>('SELECT * FROM kart WHERE rutin_id = ? ORDER BY sira, ad', [rutinId])).map(kartAc);
}

async function kartYazDb(db: SQLiteDatabase, k: Kart) {
  const s = kartKapat(k);
  await db.runAsync(
    `INSERT OR REPLACE INTO kart (id, tip, ad, aciklama, baslangic, bitis, gunler, saatler, atla, rutin_id, sira, guncellendi)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [s.id, s.tip, s.ad, s.aciklama, s.baslangic, s.bitis, s.gunler, s.saatler, s.atla, s.rutin_id, s.sira, s.guncellendi],
  );
}

async function kartSilDb(db: SQLiteDatabase, id: string, simdi: number) {
  const kayitlar = await db.getAllAsync<{ id: string }>('SELECT id FROM kayit WHERE kart_id = ?', [id]);
  for (const r of kayitlar) await izBirak(db, 'kayit', r.id, simdi);
  await db.runAsync('DELETE FROM kayit WHERE kart_id = ?', [id]);
  await db.runAsync('DELETE FROM kart WHERE id = ?', [id]);
  await izBirak(db, 'kart', id, simdi);
}

export type KartGirdi = Omit<Kart, 'id' | 'guncellendi' | 'sira' | 'atla'>;

/** Yeni kart ekler (id yoksa, listenin sonuna) ya da var olanı günceller. */
export function kartKaydet(girdi: KartGirdi, id?: string) {
  return yaz(async (db, simdi) => {
    if (id) {
      const eski = await db.getFirstAsync<KartSatiri>('SELECT * FROM kart WHERE id = ?', [id]);
      if (!eski) return;
      const e = kartAc(eski);
      // Zamanlama penceresi dışında kalan atla tarihleri anlamsız; temizle.
      const atla = e.atla.filter((t) => t >= girdi.baslangic && (girdi.bitis === null || t <= girdi.bitis));
      await kartYazDb(db, { ...e, ...girdi, atla, guncellendi: simdi });
    } else {
      const s = await db.getFirstAsync<{ m: number | null }>('SELECT MAX(sira) AS m FROM kart');
      await kartYazDb(db, { ...girdi, id: yeniId(), atla: [], sira: (s?.m ?? 0) + 1, guncellendi: simdi });
    }
  });
}

/** Kartı siler. Tekrar eden kartta seçime göre: yalnız bu gün / bundan sonra; 'tumu' kartı tümden siler. */
export function kartSil(id: string, tarih: string, secim: SilmeSecimi | 'tumu') {
  return yaz(async (db, simdi) => {
    const s = await db.getFirstAsync<KartSatiri>('SELECT * FROM kart WHERE id = ?', [id]);
    if (!s) return;
    if (secim === 'tumu') return kartSilDb(db, id, simdi);
    const plan = silmePlani(kartAc(s), tarih, secim);
    if (plan.sil) return kartSilDb(db, id, simdi);
    await kartYazDb(db, { ...kartAc(s), ...plan.degisim, guncellendi: simdi });
  });
}

// ———————————————— Kayıtlar ————————————————

export async function gunKayitlari(tarih: string): Promise<Kayit[]> {
  const db = await vt();
  return (await db.getAllAsync<KayitSatiri>('SELECT * FROM kayit WHERE tarih = ?', [tarih])).map(kayitAc);
}

export function yapildiDegistir(kartId: string, tarih: string) {
  return yaz(async (db, simdi) => {
    const id = kayitId(kartId, tarih);
    const s = await db.getFirstAsync<KayitSatiri>('SELECT * FROM kayit WHERE id = ?', [id]);
    const yapildi = !(s && s.yapildi);
    await db.runAsync('INSERT OR REPLACE INTO kayit (id, kart_id, tarih, yapildi, zaman, guncellendi) VALUES (?, ?, ?, ?, ?, ?)', [
      id, kartId, tarih, yapildi ? 1 : 0, yapildi ? simdi : null, simdi,
    ]);
  });
}

// ———————————————— Denge ————————————————

/** Denge hesabı için gereken her şey. */
export async function dengeVerisi(t = bugun()) {
  const db = await vt();
  const bas = tarihEkle(haftaBasi(t), -7 * (HAFTA_SAYISI - 1));
  const [alanlar, rutinler, kartlar, kayitlar] = await Promise.all([
    alanlariGetir(),
    rutinleriGetir(),
    db.getAllAsync<{ id: string; rutin_id: string | null }>('SELECT id, rutin_id FROM kart WHERE rutin_id IS NOT NULL'),
    db.getAllAsync<KayitSatiri>('SELECT * FROM kayit WHERE yapildi = 1 AND tarih >= ? AND tarih <= ?', [bas, t]),
  ]);
  return { alanlar, rutinler, kartlar, kayitlar: kayitlar.map(kayitAc) };
}

export { gorunurAlanlar };

// ———————————————— Hepsi ————————————————

export async function tumVerileriSil() {
  const db = await vt();
  await semayiSifirla(db);
  degisti();
}
