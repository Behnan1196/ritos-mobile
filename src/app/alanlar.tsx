// Alanları düzenle: göster/gizle, sırala, yeni alan ekle, kendi alanını sil.

import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { ModalKabuk } from '../bilesen/ModalKabuk';
import { BOSLUK, DOKUNMA, YARICAP, useRenkler } from '../bilesen/tema';
import { AlanEtiketi, BolumBasligi, Cip, CipSirasi, Dugme, Girdi, SecimPenceresi, SimgeDugme, Yazi } from '../bilesen/ui';
import { ALAN_IKONLARI, siraTasi } from '../mantik/alanlar';
import type { YasamAlani } from '../mantik/tipler';
import { alanEkle, alanGizle, alanSil, alanSirala, alanlariGetir } from '../veri/depo';
import { useVeri } from '../veri/olay';

export default function AlanlarModal() {
  const r = useRenkler();
  const { veri: alanlar } = useVeri(alanlariGetir, []);
  const [yeniAd, setYeniAd] = useState('');
  const [yeniIkon, setYeniIkon] = useState('🌿');
  const [silinecek, setSilinecek] = useState<YasamAlani | null>(null);

  const tasi = (id: string, yon: -1 | 1) => {
    if (!alanlar) return;
    alanSirala(siraTasi(alanlar.map((a) => a.id), id, yon));
  };

  const ekle = async () => {
    if (!yeniAd.trim()) return;
    await alanEkle(yeniAd, yeniIkon);
    setYeniAd('');
  };

  return (
    <ModalKabuk baslik="Yaşam alanları">
      <Yazi soluk boyut={14}>
        Gizlenen alanlar dengede ve rutin kurarken görünmez. Hazır alanlar silinmez, gizlenir; kendi eklediğin alanı silebilirsin.
      </Yazi>

      <View style={{ gap: BOSLUK.s }}>
        {(alanlar ?? []).map((a, i) => (
          <View key={a.id} style={[s.satir, { backgroundColor: r.yuzey, borderColor: r.cizgi, opacity: a.gizli ? 0.6 : 1 }]}>
            <View style={s.oklar}>
              <SimgeDugme simge="↑" erisim={`${a.ad} yukarı taşı`} onPress={() => tasi(a.id, -1)} renk={i === 0 ? r.cizgi : r.soluk} boyut={18} />
              <SimgeDugme simge="↓" erisim={`${a.ad} aşağı taşı`} onPress={() => tasi(a.id, 1)} renk={i === (alanlar?.length ?? 0) - 1 ? r.cizgi : r.soluk} boyut={18} />
            </View>
            <Text style={{ fontSize: 24 }}>{a.ikon}</Text>
            <View style={{ flex: 1 }}>
              <Yazi boyut={16} satir={1}>{a.ad}</Yazi>
              {a.aciklama ? <Yazi soluk boyut={12} satir={1}>{a.aciklama}</Yazi> : null}
            </View>
            {!a.kod && <SimgeDugme simge="🗑" erisim={`${a.ad} alanını sil`} onPress={() => setSilinecek(a)} boyut={18} />}
            <Switch
              accessibilityLabel={`${a.ad} göster`}
              value={!a.gizli}
              onValueChange={(v) => alanGizle(a.id, !v)}
              trackColor={{ true: r.vurgu, false: r.cizgi }}
            />
          </View>
        ))}
      </View>

      <BolumBasligi>Yeni alan</BolumBasligi>
      <Girdi etiket="Ad" value={yeniAd} onChangeText={setYeniAd} placeholder="Ör. İş, Para, Ev" maxLength={40} returnKeyType="done" onSubmitEditing={ekle} />
      <View style={{ gap: BOSLUK.s }}>
        <AlanEtiketi>İkon</AlanEtiketi>
        <CipSirasi>
          {ALAN_IKONLARI.map((e) => <Cip key={e} etiket={e} secili={yeniIkon === e} onPress={() => setYeniIkon(e)} erisim={`İkon ${e}`} />)}
        </CipSirasi>
      </View>
      <Dugme etiket="Alanı ekle" onPress={ekle} devreDisi={!yeniAd.trim()} />

      <SecimPenceresi
        acik={!!silinecek}
        baslik={`${silinecek?.ad ?? ''} silinsin mi?`}
        mesaj="Alan, rutinlerdeki etiketlerden de kalkar."
        secenekler={[{ etiket: 'Alanı sil', tehlike: true, onPress: () => silinecek && alanSil(silinecek.id) }]}
        kapat={() => setSilinecek(null)}
      />
    </ModalKabuk>
  );
}

const s = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: BOSLUK.s, paddingRight: BOSLUK.m, borderRadius: YARICAP.m, borderWidth: StyleSheet.hairlineWidth, minHeight: DOKUNMA + 8 },
  oklar: { flexDirection: 'row' },
});
