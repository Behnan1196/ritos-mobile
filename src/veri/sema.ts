// SQLite şeması ve migrasyonlar. Sürüm PRAGMA user_version ile tutulur:
// her migrasyon bir kez, sırayla çalışır. Yeni değişiklik = dizinin sonuna yeni bir adım.
// Liste/nesne alanları JSON metin kolonudur. Her satırda `guncellendi` (epoch ms) vardır —
// dilim 2'de eşitleme/çakışma kuralı ("son yazan kazanır") bunu kullanacak.

import type { SQLiteDatabase } from 'expo-sqlite';
import { hazirAlanSatirlari } from '../mantik/alanlar';

type Adim = (db: SQLiteDatabase) => Promise<void>;

const MIGRASYONLAR: Adim[] = [
  // 1 — dilim 1 tabloları
  async (db) => {
    await db.execAsync(`
      CREATE TABLE yasam_alani (
        id TEXT PRIMARY KEY NOT NULL,
        kod TEXT,
        ad TEXT NOT NULL,
        ikon TEXT NOT NULL,
        aciklama TEXT NOT NULL DEFAULT '',
        sira INTEGER NOT NULL,
        gizli INTEGER NOT NULL DEFAULT 0,
        guncellendi INTEGER NOT NULL
      );
      CREATE TABLE rutin (
        id TEXT PRIMARY KEY NOT NULL,
        ad TEXT NOT NULL,
        ikon TEXT NOT NULL DEFAULT '🌱',
        amac TEXT NOT NULL DEFAULT '',
        alanlar TEXT NOT NULL DEFAULT '[]',
        durum TEXT NOT NULL DEFAULT 'kuruluyor' CHECK (durum IN ('kuruluyor','oturdu','arsiv')),
        durum_tarih TEXT NOT NULL,
        kaliplar TEXT NOT NULL DEFAULT '[]',
        guncellendi INTEGER NOT NULL
      );
      CREATE TABLE kart (
        id TEXT PRIMARY KEY NOT NULL,
        tip TEXT NOT NULL CHECK (tip IN ('yap','oku','kaydet','uygula')),
        ad TEXT NOT NULL,
        aciklama TEXT NOT NULL DEFAULT '',
        baslangic TEXT NOT NULL,
        bitis TEXT,
        gunler TEXT,
        saatler TEXT NOT NULL DEFAULT '[]',
        atla TEXT NOT NULL DEFAULT '[]',
        rutin_id TEXT,
        sira INTEGER NOT NULL DEFAULT 0,
        guncellendi INTEGER NOT NULL
      );
      CREATE INDEX kart_rutin ON kart (rutin_id);
      CREATE INDEX kart_tarih ON kart (baslangic, bitis);
      CREATE TABLE kayit (
        id TEXT PRIMARY KEY NOT NULL,
        kart_id TEXT NOT NULL,
        tarih TEXT NOT NULL,
        yapildi INTEGER NOT NULL DEFAULT 0,
        zaman INTEGER,
        guncellendi INTEGER NOT NULL
      );
      CREATE INDEX kayit_tarih ON kayit (tarih);
      CREATE INDEX kayit_kart ON kayit (kart_id);
      CREATE TABLE ayar (
        anahtar TEXT PRIMARY KEY NOT NULL,
        deger TEXT NOT NULL,
        guncellendi INTEGER NOT NULL
      );
      -- Silinen satırların izi (dilim 2'de eşitleme silmeyi de taşıyabilsin diye).
      CREATE TABLE silinen (
        tablo TEXT NOT NULL,
        id TEXT NOT NULL,
        guncellendi INTEGER NOT NULL,
        PRIMARY KEY (tablo, id)
      );
    `);
    for (const a of hazirAlanSatirlari()) {
      await db.runAsync(
        'INSERT INTO yasam_alani (id, kod, ad, ikon, aciklama, sira, gizli, guncellendi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [a.id, a.kod, a.ad, a.ikon, a.aciklama, a.sira, a.gizli ? 1 : 0, a.guncellendi],
      );
    }
  },
];

export const SEMA_SURUMU = MIGRASYONLAR.length;

export async function migrasyonlariUygula(db: SQLiteDatabase): Promise<void> {
  const satir = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let surum = satir?.user_version ?? 0;
  while (surum < MIGRASYONLAR.length) {
    const adim = MIGRASYONLAR[surum]!;
    await db.withTransactionAsync(async () => {
      await adim(db);
    });
    surum++;
    // PRAGMA parametre almaz; sayı bizden geldiği için güvenli.
    await db.execAsync(`PRAGMA user_version = ${surum}`);
  }
}

/** "Tüm verileri sil": tabloları düşürüp şemayı baştan kurar. */
export async function semayiSifirla(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DROP TABLE IF EXISTS yasam_alani;
    DROP TABLE IF EXISTS rutin;
    DROP TABLE IF EXISTS kart;
    DROP TABLE IF EXISTS kayit;
    DROP TABLE IF EXISTS ayar;
    DROP TABLE IF EXISTS silinen;
    PRAGMA user_version = 0;
  `);
  await migrasyonlariUygula(db);
}
