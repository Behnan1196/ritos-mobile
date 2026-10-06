// Denge kartı: her görünür alan için 0–4 puan, yatay çubuk. Emek koyu, taban açık renkle.

import { StyleSheet, Text, View } from 'react-native';

import type { AlanDenge } from '../mantik/denge';
import { EN_COK } from '../mantik/denge';
import { BOSLUK, YARICAP, useRenkler } from './tema';
import { Kutu, Yazi } from './ui';

export function DengeKarti({ denge }: { denge: AlanDenge[] }) {
  const r = useRenkler();
  return (
    <Kutu stil={{ gap: BOSLUK.m }}>
      <View style={{ gap: 2 }}>
        <Yazi kalin boyut={17}>Denge</Yazi>
        <Yazi soluk boyut={13}>Son 4 haftada rutin kartlarını yaptığın haftalar ve oturmuş rutinler.</Yazi>
      </View>
      {denge.length === 0 ? (
        <Yazi soluk boyut={14}>Görünür alan yok. Alanları düzenleyerek ekleyebilirsin.</Yazi>
      ) : (
        denge.map((d) => (
          <View
            key={d.alan.id}
            style={s.satir}
            accessible
            accessibilityLabel={`${d.alan.ad}: ${d.toplam} / ${EN_COK}. Emek ${d.emek}, taban ${d.taban}.`}
          >
            <Text style={s.ikon}>{d.alan.ikon}</Text>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={s.ustSatir}>
                <Text style={{ color: r.yazi, fontSize: 14, flex: 1 }} numberOfLines={1}>{d.alan.ad}</Text>
                <Text style={{ color: r.soluk, fontSize: 13 }}>{d.toplam}/{EN_COK}</Text>
              </View>
              <View style={[s.cubuk, { backgroundColor: r.yuzey2 }]}>
                {Array.from({ length: EN_COK }, (_, i) => {
                  // Önce taban (oturmuş rutin), üstüne emek.
                  const dolu = i < d.toplam;
                  const tabanDilimi = i < Math.min(d.taban, d.toplam);
                  return (
                    <View
                      key={i}
                      style={[
                        s.dilim,
                        { backgroundColor: dolu ? (tabanDilimi ? r.taban : r.vurgu) : 'transparent' },
                        i < EN_COK - 1 && { borderRightWidth: 2, borderRightColor: r.yuzey },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        ))
      )}
      <View style={s.lejant}>
        <View style={[s.kare, { backgroundColor: r.vurgu }]} />
        <Yazi soluk boyut={12}>emek</Yazi>
        <View style={[s.kare, { backgroundColor: r.taban, marginLeft: BOSLUK.m }]} />
        <Yazi soluk boyut={12}>oturmuş rutin (taban)</Yazi>
      </View>
    </Kutu>
  );
}

const s = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: BOSLUK.m },
  ikon: { fontSize: 22, width: 30, textAlign: 'center' },
  ustSatir: { flexDirection: 'row', alignItems: 'center' },
  cubuk: { height: 10, borderRadius: YARICAP.tam, flexDirection: 'row', overflow: 'hidden' },
  dilim: { flex: 1 },
  lejant: { flexDirection: 'row', alignItems: 'center', gap: BOSLUK.xs },
  kare: { width: 10, height: 10, borderRadius: 3 },
});
