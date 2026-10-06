// Ayarlar: ad, alanlar, tüm verileri sil.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BOSLUK, DOKUNMA, YARICAP, useRenkler } from '../../bilesen/tema';
import { BolumBasligi, SecimPenceresi, Yazi } from '../../bilesen/ui';
import { AYAR, alanlariGetir, ayarOku, tumVerileriSil } from '../../veri/depo';
import { useVeri } from '../../veri/olay';

export default function Ayarlar() {
  const r = useRenkler();
  const [silOnay, setSilOnay] = useState(false);
  const { veri } = useVeri(async () => {
    const [ad, alanlar] = await Promise.all([ayarOku(AYAR.ad, ''), alanlariGetir()]);
    return { ad, gorunur: alanlar.filter((a) => !a.gizli).length, toplam: alanlar.length };
  }, []);

  return (
    <ScrollView style={{ backgroundColor: r.zemin }} contentContainerStyle={s.icerik}>
      <BolumBasligi>Profil</BolumBasligi>
      <Satir etiket="Adın" deger={veri?.ad || 'Belirtilmedi'} onPress={() => router.push('/ad')} />

      <BolumBasligi>Rutinlerim</BolumBasligi>
      <Satir etiket="Yaşam alanları" deger={veri ? `${veri.gorunur} / ${veri.toplam} görünür` : ''} onPress={() => router.push('/alanlar')} />

      <BolumBasligi>Veri</BolumBasligi>
      <Yazi soluk boyut={13} stil={{ marginBottom: BOSLUK.s }}>
        Tüm verilerin yalnız bu cihazda saklanır. Hesap yok, sunucuya bir şey gönderilmez.
      </Yazi>
      <Pressable
        accessibilityRole="button"
        onPress={() => setSilOnay(true)}
        style={({ pressed }) => [s.satir, { backgroundColor: r.yuzey, borderColor: r.cizgi, opacity: pressed ? 0.75 : 1 }]}
      >
        <Text style={{ color: r.tehlike, fontSize: 16 }}>Tüm verileri sil</Text>
      </Pressable>

      <Yazi soluk boyut={12} stil={{ textAlign: 'center', marginTop: BOSLUK.xl }}>Ritos · ilk dilim</Yazi>

      <SecimPenceresi
        acik={silOnay}
        baslik="Tüm veriler silinsin mi?"
        mesaj="Kartlar, rutinler, kayıtlar ve alan ayarların bu cihazdan kalıcı olarak silinir. Geri alınamaz."
        secenekler={[{ etiket: 'Evet, hepsini sil', tehlike: true, onPress: () => tumVerileriSil() }]}
        kapat={() => setSilOnay(false)}
      />
    </ScrollView>
  );
}

function Satir({ etiket, deger, onPress }: { etiket: string; deger: string; onPress: () => void }) {
  const r = useRenkler();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${etiket}: ${deger}`}
      onPress={onPress}
      style={({ pressed }) => [s.satir, { backgroundColor: r.yuzey, borderColor: r.cizgi, opacity: pressed ? 0.75 : 1 }]}
    >
      <Text style={{ color: r.yazi, fontSize: 16, flex: 1 }}>{etiket}</Text>
      <Text style={{ color: r.soluk, fontSize: 15 }} numberOfLines={1}>{deger}</Text>
      <Text style={{ color: r.soluk, fontSize: 20, marginLeft: BOSLUK.s }}>›</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  icerik: { padding: BOSLUK.l, paddingBottom: 64, width: '100%', maxWidth: 720, alignSelf: 'center' },
  satir: { flexDirection: 'row', alignItems: 'center', minHeight: DOKUNMA + 8, paddingHorizontal: BOSLUK.l, borderRadius: YARICAP.m, borderWidth: StyleSheet.hairlineWidth },
});
