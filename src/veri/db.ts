// Tek veritabanı bağlantısı. İlk çağrıda açılır ve migrasyonlar uygulanır.

import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { migrasyonlariUygula } from './sema';

const DB_ADI = 'ritos.db';
let acilis: Promise<SQLiteDatabase> | null = null;

export function vt(): Promise<SQLiteDatabase> {
  if (!acilis) {
    acilis = (async () => {
      const db = await openDatabaseAsync(DB_ADI);
      await migrasyonlariUygula(db);
      return db;
    })();
    acilis.catch(() => {
      acilis = null; // bir dahaki çağrıda yeniden dene
    });
  }
  return acilis;
}
