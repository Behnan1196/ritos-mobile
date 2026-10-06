// Rutin kur / düzenle modalı: ad, ikon, amaç, alan çipleri. Parametre: id (düzenleme).

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ModalKabuk } from '../bilesen/ModalKabuk';
import { BOSLUK } from '../bilesen/tema';
import { AlanEtiketi, Cip, CipSirasi, Dugme, Girdi, SecimPenceresi, Yazi } from '../bilesen/ui';
import { RUTIN_IKONLARI } from '../mantik/alanlar';
import type { YasamAlani } from '../mantik/tipler';
import { alanlariGetir, rutinGetir, rutinKaydet, rutinSil } from '../veri/depo';

export default function RutinModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [yuklendi, setYuklendi] = useState(!id);
  const [ad, setAd] = useState('');
  const [ikon, setIkon] = useState('🌱');
  const [amac, setAmac] = useState('');
  const [secili, setSecili] = useState<string[]>([]);
  const [alanlar, setAlanlar] = useState<YasamAlani[]>([]);
  const [silOnay, setSilOnay] = useState(false);
  const [denendi, setDenendi] = useState(false);

  useEffect(() => {
    alanlariGetir().then(setAlanlar);
    if (!id) return;
    rutinGetir(id).then((x) => {
      if (!x) return router.back();
      setAd(x.ad);
      setIkon(x.ikon);
      setAmac(x.amac);
      setSecili(x.alanlar);
      setYuklendi(true);
    });
  }, [id]);

  const kaydet = async () => {
    setDenendi(true);
    if (!ad.trim()) return;
    const yeni = await rutinKaydet({ ad, ikon: ikon.trim() || '🌱', amac, alanlar: secili }, id);
    if (id) router.back();
    else router.replace({ pathname: '/rutin/[id]', params: { id: yeni } });
  };

  const degistir = (a: string) => setSecili((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]));
  // Görünür alanlar + gizli olduğu hâlde bu rutinde seçili olanlar.
  const gosterilen = alanlar.filter((a) => !a.gizli || secili.includes(a.id));

  if (!yuklendi) return <ModalKabuk baslik="Rutin">{null}</ModalKabuk>;

  return (
    <ModalKabuk baslik={id ? 'Rutini düzenle' : 'Rutin kur'} kaydet={kaydet} kaydetEtiket={id ? 'Kaydet' : 'Kur'}>
      <Girdi
        etiket="Ad"
        value={ad}
        onChangeText={setAd}
        placeholder="Ör. Sabah yürüyüşü"
        autoFocus={!id}
        hata={denendi && !ad.trim() ? 'Bir ad yaz.' : null}
        maxLength={80}
      />

      <View style={{ gap: BOSLUK.s }}>
        <AlanEtiketi>İkon</AlanEtiketi>
        <CipSirasi>
          {RUTIN_IKONLARI.map((e) => <Cip key={e} etiket={e} secili={ikon === e} onPress={() => setIkon(e)} erisim={`İkon ${e}`} />)}
        </CipSirasi>
        <Girdi etiket="Ya da kendi emojin" value={ikon} onChangeText={(t) => setIkon(Array.from(t).slice(-2).join(''))} maxLength={8} />
      </View>

      <Girdi etiket="Amaç" value={amac} onChangeText={setAmac} placeholder="Bu rutinle neyi oturtmak istiyorsun?" multiline maxLength={300} />

      <View style={{ gap: BOSLUK.s }}>
        <AlanEtiketi>Yaşam alanları</AlanEtiketi>
        <Yazi soluk boyut={13}>Rutin hangi alanlara dokunuyor? Denge bu etiketlerle hesaplanır.</Yazi>
        <CipSirasi>
          {gosterilen.map((a) => <Cip key={a.id} etiket={`${a.ikon} ${a.ad}`} secili={secili.includes(a.id)} onPress={() => degistir(a.id)} />)}
        </CipSirasi>
      </View>

      {id && <Dugme etiket="Rutini sil" tur="tehlike" onPress={() => setSilOnay(true)} stil={{ marginTop: BOSLUK.l }} />}

      <SecimPenceresi
        acik={silOnay}
        baslik="Rutin silinsin mi?"
        mesaj="Rutin, kartları ve kartların geçmiş kayıtları silinir. Geri alınamaz. Yalnız bırakmak istiyorsan Arşivle'yi kullan."
        secenekler={[
          {
            etiket: 'Rutini sil',
            tehlike: true,
            onPress: async () => {
              if (!id) return;
              await rutinSil(id);
              router.dismissAll();
            },
          },
        ]}
        kapat={() => setSilOnay(false)}
      />
    </ModalKabuk>
  );
}
