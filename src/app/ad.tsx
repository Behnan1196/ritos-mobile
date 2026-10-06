// Ad düzenleme modalı.

import { useEffect, useState } from 'react';
import { router } from 'expo-router';

import { ModalKabuk } from '../bilesen/ModalKabuk';
import { Girdi, Yazi } from '../bilesen/ui';
import { AYAR, ayarOku, ayarYaz } from '../veri/depo';

export default function AdModal() {
  const [ad, setAd] = useState<string | null>(null);
  useEffect(() => {
    ayarOku(AYAR.ad, '').then(setAd);
  }, []);
  const kaydet = async () => {
    await ayarYaz(AYAR.ad, (ad ?? '').trim());
    router.back();
  };
  return (
    <ModalKabuk baslik="Adın" kaydet={kaydet}>
      {ad !== null && (
        <>
          <Girdi etiket="Adın" value={ad} onChangeText={setAd} placeholder="İsteğe bağlı" autoFocus maxLength={40} returnKeyType="done" onSubmitEditing={kaydet} />
          <Yazi soluk boyut={14}>Yalnız ajandadaki selamlamada kullanılır; cihazdan çıkmaz.</Yazi>
        </>
      )}
    </ModalKabuk>
  );
}
