// Basit değişiklik yayını: veri katmanı her yazmadan sonra `degisti()` der,
// ekranlar `useVeri` ile abone olup sorgularını yeniden çalıştırır.
// Dilim 2'de Realtime'dan gelen değişiklikler de buradan duyurulabilir.

import { useCallback, useEffect, useRef, useState } from 'react';

type Dinleyici = () => void;
const dinleyiciler = new Set<Dinleyici>();
let surum = 0;

export function degisti(): void {
  surum++;
  for (const d of dinleyiciler) d();
}

export function dinle(d: Dinleyici): () => void {
  dinleyiciler.add(d);
  return () => {
    dinleyiciler.delete(d);
  };
}

/** Bir sorguyu çalıştırır; veri değişince ya da bağımlılıklar değişince yeniler. */
export function useVeri<T>(sorgu: () => Promise<T>, bagimliliklar: unknown[]): { veri: T | undefined; yenile: () => void } {
  const [veri, setVeri] = useState<T | undefined>(undefined);
  const [tik, setTik] = useState(surum);
  const sorguRef = useRef(sorgu);
  sorguRef.current = sorgu;

  useEffect(() => dinle(() => setTik((t) => t + 1)), []);

  useEffect(() => {
    let iptal = false;
    sorguRef.current().then(
      (v) => {
        if (!iptal) setVeri(v);
      },
      (e: unknown) => console.warn('Sorgu hatası', e),
    );
    return () => {
      iptal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tik, ...bagimliliklar]);

  const yenile = useCallback(() => setTik((t) => t + 1), []);
  return { veri, yenile };
}
