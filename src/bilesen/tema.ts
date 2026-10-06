// Renk ve ölçü belirteçleri. Açık/koyu tema sistemden gelir (useColorScheme).

import { useColorScheme } from 'react-native';

export interface Renkler {
  zemin: string;
  yuzey: string;
  yuzey2: string;
  yazi: string;
  soluk: string;
  cizgi: string;
  vurgu: string;
  vurguYazi: string;
  vurguSoft: string;
  taban: string;
  tehlike: string;
  basari: string;
}

const ACIK: Renkler = {
  zemin: '#F6F5F2',
  yuzey: '#FFFFFF',
  yuzey2: '#EFEDE8',
  yazi: '#1D1B18',
  soluk: '#6B675F',
  cizgi: '#DEDAD2',
  vurgu: '#2F6F5E',
  vurguYazi: '#FFFFFF',
  vurguSoft: '#DCEBE6',
  taban: '#A7C7BD',
  tehlike: '#B3261E',
  basari: '#2F6F5E',
};

const KOYU: Renkler = {
  zemin: '#121212',
  yuzey: '#1E1E1C',
  yuzey2: '#2A2926',
  yazi: '#F1EFEA',
  soluk: '#A39F96',
  cizgi: '#3A3833',
  vurgu: '#6BC0A6',
  vurguYazi: '#0E1F1A',
  vurguSoft: '#203A33',
  taban: '#3E6B5E',
  tehlike: '#F2B8B5',
  basari: '#6BC0A6',
};

export function useRenkler(): Renkler {
  return useColorScheme() === 'dark' ? KOYU : ACIK;
}

export const useKoyu = () => useColorScheme() === 'dark';

/** En küçük dokunma hedefi (pt). */
export const DOKUNMA = 44;
export const BOSLUK = { xs: 4, s: 8, m: 12, l: 16, xl: 24 };
export const YARICAP = { s: 8, m: 12, l: 16, tam: 999 };
