// Rutinlerim: üstte denge kartı, altında Kuruluyor / Oturdu / Arşiv bölümleri.

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { DengeKarti } from '../../bilesen/DengeKarti';
import { BOSLUK, DOKUNMA, YARICAP, useRenkler } from '../../bilesen/tema';
import { BolumBasligi, BosDurum, Dugme, Yazi, YuzenDugme } from '../../bilesen/ui';
import { dengeHesapla } from '../../mantik/denge';
import { DURUM_ETIKET, DURUM_SIRASI } from '../../mantik/rutinDongu';
import { bugun } from '../../mantik/tarih';
import type { Rutin, YasamAlani } from '../../mantik/tipler';
import { dengeVerisi } from '../../veri/depo';
import { useVeri } from '../../veri/olay';

export default function Rutinlerim() {
  const r = useRenkler();
  const ic = useSafeAreaInsets();
  const { veri } = useVeri(async () => {
    const t = bugun();
    const v = await dengeVerisi(t);
    return {
      rutinler: v.rutinler,
      alanlar: new Map(v.alanlar.map((a) => [a.id, a])),
      denge: dengeHesapla(v.alanlar, v.rutinler, v.kartlar, v.kayitlar, t),
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: r.zemin, paddingTop: ic.top }}>
      <ScrollView contentContainerStyle={s.icerik}>
        <View style={s.baslik}>
          <Yazi kalin boyut={26}>Rutinlerim</Yazi>
          <Dugme etiket="Alanları düzenle" tur="metin" onPress={() => router.push('/alanlar')} />
        </View>

        {veri && <DengeKarti denge={veri.denge} />}

        {veri && veri.rutinler.length === 0 && (
          <BosDurum simge="🌱" baslik="Henüz rutin yok" aciklama="Oturtmak istediğin bir alışkanlık için rutin kur; kartlarını ajandana ekle." />
        )}

        {veri &&
          DURUM_SIRASI.map((durum) => {
            const liste = veri.rutinler.filter((x) => x.durum === durum);
            if (!liste.length) return null;
            return (
              <View key={durum}>
                <BolumBasligi>{`${DURUM_ETIKET[durum]} · ${liste.length}`}</BolumBasligi>
                <View style={{ gap: BOSLUK.s }}>
                  {liste.map((x) => <RutinSatiri key={x.id} rutin={x} alanlar={veri.alanlar} />)}
                </View>
              </View>
            );
          })}
      </ScrollView>
      <YuzenDugme erisim="Rutin kur" etiket="＋ Rutin kur" onPress={() => router.push('/rutin-duzenle')} />
    </View>
  );
}

function RutinSatiri({ rutin, alanlar }: { rutin: Rutin; alanlar: Map<string, YasamAlani> }) {
  const r = useRenkler();
  const etiketler = rutin.alanlar.map((id) => alanlar.get(id)).filter((a): a is YasamAlani => !!a);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${rutin.ad}, ${DURUM_ETIKET[rutin.durum]}`}
      onPress={() => router.push({ pathname: '/rutin/[id]', params: { id: rutin.id } })}
      style={({ pressed }) => [s.satir, { backgroundColor: r.yuzey, borderColor: r.cizgi, opacity: pressed ? 0.75 : 1 }]}
    >
      <Text style={{ fontSize: 28 }}>{rutin.ikon}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Yazi kalin boyut={16} satir={1}>{rutin.ad}</Yazi>
        {rutin.amac ? <Yazi soluk boyut={14} satir={1}>{rutin.amac}</Yazi> : null}
        {etiketler.length > 0 && <Yazi soluk boyut={13} satir={1}>{etiketler.map((a) => `${a.ikon} ${a.ad}`).join('  ·  ')}</Yazi>}
      </View>
      <Text style={{ color: r.soluk, fontSize: 20 }}>›</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  icerik: { padding: BOSLUK.l, paddingBottom: 120, width: '100%', maxWidth: 720, alignSelf: 'center', gap: BOSLUK.s },
  baslik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: BOSLUK.m, marginBottom: BOSLUK.s },
  satir: { flexDirection: 'row', alignItems: 'center', gap: BOSLUK.m, padding: BOSLUK.m, borderRadius: YARICAP.l, borderWidth: StyleSheet.hairlineWidth, minHeight: DOKUNMA + 16 },
});
