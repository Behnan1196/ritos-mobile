// Tarih yardımcıları — yerel saat, "YYYY-MM-DD" metin tabanlı.

export function tarihStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${g}`;
}

export function bugun(): string {
  return tarihStr(new Date());
}

export function tarihParse(t: string): Date {
  const [y = 1970, m = 1, g = 1] = t.split('-').map(Number);
  return new Date(y, m - 1, g);
}

export function tarihEkle(t: string, n: number): string {
  const d = tarihParse(t);
  d.setDate(d.getDate() + n);
  return tarihStr(d);
}

/** b - a, gün olarak. */
export function gunFarki(a: string, b: string): number {
  return Math.round((tarihParse(b).getTime() - tarihParse(a).getTime()) / 86400000);
}

/** 0=Pazar … 6=Cumartesi */
export const haftaGunu = (t: string) => tarihParse(t).getDay();

/** Haftanın pazartesisi. */
export const haftaBasi = (t: string) => tarihEkle(t, -((haftaGunu(t) + 6) % 7));

export function gecerliTarih(t: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return false;
  return tarihStr(tarihParse(t)) === t;
}

export function gecerliSaat(s: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}

/** "9:5" ya da "0930" gibi girişleri "09:30" biçimine getirir; olmazsa null. */
export function saatDuzelt(s: string): string | null {
  const t = s.trim().replace('.', ':');
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(t) ?? /^(\d{1,2})(\d{2})$/.exec(t) ?? /^(\d{1,2})()$/.exec(t);
  if (!m) return null;
  const sonuc = `${m[1]!.padStart(2, '0')}:${(m[2] || '0').padStart(2, '0')}`;
  return gecerliSaat(sonuc) ? sonuc : null;
}

export const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const GUN_ADLARI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
/** Pazartesiden başlayan sıra (arayüzde gün seçimi için). */
export const HAFTA_SIRASI = [1, 2, 3, 4, 5, 6, 0];

export function tarihEtiket(t: string): string {
  const d = tarihParse(t);
  return `${d.getDate()} ${AYLAR[d.getMonth()]}, ${GUN_ADLARI[d.getDay()]}`;
}

/** Gün şeridi için kısa ad: Dün / Bugün / Yarın ya da "Pzt". */
export function goreceliGun(t: string, referans: string): string | null {
  const f = gunFarki(referans, t);
  if (f === -1) return 'Dün';
  if (f === 0) return 'Bugün';
  if (f === 1) return 'Yarın';
  return null;
}
