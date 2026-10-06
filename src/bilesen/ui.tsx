// Ortak arayüz parçaları: düğme, çip, girdi, başlık, boş durum, seçim penceresi.

import { type ReactNode } from 'react';
import {
  Modal, Pressable, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOSLUK, DOKUNMA, YARICAP, useRenkler } from './tema';

// ———————————————— Yazı ————————————————

export function Yazi({ children, soluk, kalin, boyut = 16, stil, satir }: {
  children: ReactNode; soluk?: boolean; kalin?: boolean; boyut?: number; stil?: StyleProp<import('react-native').TextStyle>; satir?: number;
}) {
  const r = useRenkler();
  return (
    <Text numberOfLines={satir} style={[{ color: soluk ? r.soluk : r.yazi, fontSize: boyut, fontWeight: kalin ? '600' : '400' }, stil]}>
      {children}
    </Text>
  );
}

export function BolumBasligi({ children, sag }: { children: ReactNode; sag?: ReactNode }) {
  const r = useRenkler();
  return (
    <View style={s.bolumBaslik}>
      <Text style={[s.bolumYazi, { color: r.soluk }]}>{children}</Text>
      {sag}
    </View>
  );
}

// ———————————————— Düğmeler ————————————————

type DugmeTuru = 'ana' | 'ikincil' | 'tehlike' | 'metin';

export function Dugme({ etiket, onPress, tur = 'ana', devreDisi, stil, erisim }: {
  etiket: string; onPress: () => void; tur?: DugmeTuru; devreDisi?: boolean; stil?: StyleProp<ViewStyle>; erisim?: string;
}) {
  const r = useRenkler();
  const zemin = tur === 'ana' ? r.vurgu : tur === 'ikincil' ? r.yuzey2 : 'transparent';
  const renk = tur === 'ana' ? r.vurguYazi : tur === 'tehlike' ? r.tehlike : tur === 'metin' ? r.vurgu : r.yazi;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={erisim ?? etiket}
      accessibilityState={{ disabled: !!devreDisi }}
      disabled={devreDisi}
      onPress={onPress}
      style={({ pressed }) => [
        s.dugme,
        { backgroundColor: zemin, opacity: devreDisi ? 0.4 : pressed ? 0.75 : 1 },
        tur === 'tehlike' && { borderWidth: 1, borderColor: r.tehlike },
        stil,
      ]}
    >
      <Text style={[s.dugmeYazi, { color: renk }]}>{etiket}</Text>
    </Pressable>
  );
}

/** Kare simge düğmesi (en az 44×44). */
export function SimgeDugme({ simge, onPress, erisim, boyut = 20, renk }: {
  simge: string; onPress: () => void; erisim: string; boyut?: number; renk?: string;
}) {
  const r = useRenkler();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={erisim}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [s.simgeDugme, { opacity: pressed ? 0.5 : 1 }]}
    >
      <Text style={{ fontSize: boyut, color: renk ?? r.yazi }}>{simge}</Text>
    </Pressable>
  );
}

/** Sağ altta yüzen ＋ düğmesi. */
export function YuzenDugme({ onPress, erisim, etiket }: { onPress: () => void; erisim: string; etiket?: string }) {
  const r = useRenkler();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={erisim}
      onPress={onPress}
      style={({ pressed }) => [s.yuzen, { backgroundColor: r.vurgu, opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={{ color: r.vurguYazi, fontSize: etiket ? 16 : 28, fontWeight: '600' }}>{etiket ?? '＋'}</Text>
    </Pressable>
  );
}

// ———————————————— Çip ————————————————

export function Cip({ etiket, secili, onPress, erisim }: { etiket: string; secili?: boolean; onPress?: () => void; erisim?: string }) {
  const r = useRenkler();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={erisim ?? etiket}
      accessibilityState={onPress ? { selected: !!secili } : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        s.cip,
        {
          backgroundColor: secili ? r.vurgu : r.yuzey,
          borderColor: secili ? r.vurgu : r.cizgi,
          opacity: pressed ? 0.75 : 1,
          minHeight: onPress ? DOKUNMA : 28,
        },
      ]}
    >
      <Text style={{ color: secili ? r.vurguYazi : r.yazi, fontSize: 15 }}>{etiket}</Text>
    </Pressable>
  );
}

export function CipSirasi({ children }: { children: ReactNode }) {
  return <View style={s.cipSirasi}>{children}</View>;
}

/** Küçük, dokunulmayan etiket (ör. kartın rutini). */
export function Etiket({ metin }: { metin: string }) {
  const r = useRenkler();
  return (
    <View style={[s.etiket, { backgroundColor: r.vurguSoft }]}>
      <Text style={{ color: r.yazi, fontSize: 12 }} numberOfLines={1}>{metin}</Text>
    </View>
  );
}

// ———————————————— Girdi ————————————————

export function Girdi({ etiket, ipucu, hata, ...props }: TextInputProps & { etiket: string; ipucu?: string; hata?: string | null }) {
  const r = useRenkler();
  return (
    <View style={{ gap: BOSLUK.xs }}>
      <Text style={[s.alanEtiket, { color: r.soluk }]}>{etiket}</Text>
      <TextInput
        accessibilityLabel={etiket}
        placeholderTextColor={r.soluk}
        {...props}
        style={[
          s.girdi,
          { color: r.yazi, backgroundColor: r.yuzey, borderColor: hata ? r.tehlike : r.cizgi },
          props.multiline && { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 },
          props.style,
        ]}
      />
      {hata ? <Text style={{ color: r.tehlike, fontSize: 13 }}>{hata}</Text> : ipucu ? <Text style={{ color: r.soluk, fontSize: 13 }}>{ipucu}</Text> : null}
    </View>
  );
}

export function AlanEtiketi({ children }: { children: ReactNode }) {
  const r = useRenkler();
  return <Text style={[s.alanEtiket, { color: r.soluk }]}>{children}</Text>;
}

// ———————————————— Kart kutusu, boş durum ————————————————

export function Kutu({ children, stil }: { children: ReactNode; stil?: StyleProp<ViewStyle> }) {
  const r = useRenkler();
  return <View style={[s.kutu, { backgroundColor: r.yuzey, borderColor: r.cizgi }, stil]}>{children}</View>;
}

export function BosDurum({ simge, baslik, aciklama }: { simge: string; baslik: string; aciklama?: string }) {
  return (
    <View style={s.bos}>
      <Text style={{ fontSize: 40 }}>{simge}</Text>
      <Yazi kalin boyut={17} stil={{ textAlign: 'center' }}>{baslik}</Yazi>
      {aciklama ? <Yazi soluk boyut={15} stil={{ textAlign: 'center' }}>{aciklama}</Yazi> : null}
    </View>
  );
}

// ———————————————— Seçim penceresi (onay / seçenek) ————————————————
// Alert.alert web'de çalışmadığı için her platformda aynı görünen alt pencere.

export interface Secenek { etiket: string; tehlike?: boolean; onPress: () => void }

export function SecimPenceresi({ acik, baslik, mesaj, secenekler, kapat }: {
  acik: boolean; baslik: string; mesaj?: string; secenekler: Secenek[]; kapat: () => void;
}) {
  const r = useRenkler();
  const ic = useSafeAreaInsets();
  return (
    <Modal visible={acik} transparent animationType="fade" onRequestClose={kapat}>
      <Pressable style={s.perde} onPress={kapat} accessibilityLabel="Kapat">
        <Pressable style={[s.sayfa, { backgroundColor: r.yuzey, paddingBottom: ic.bottom + BOSLUK.l }]} onPress={() => {}}>
          <Yazi kalin boyut={18}>{baslik}</Yazi>
          {mesaj ? <Yazi soluk boyut={15}>{mesaj}</Yazi> : null}
          <View style={{ gap: BOSLUK.s, marginTop: BOSLUK.s }}>
            {secenekler.map((o) => (
              <Dugme
                key={o.etiket}
                etiket={o.etiket}
                tur={o.tehlike ? 'tehlike' : 'ikincil'}
                onPress={() => {
                  kapat();
                  o.onPress();
                }}
              />
            ))}
            <Dugme etiket="Vazgeç" tur="metin" onPress={kapat} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  bolumBaslik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: BOSLUK.xl, marginBottom: BOSLUK.s, minHeight: 28 },
  bolumYazi: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  dugme: { minHeight: DOKUNMA, borderRadius: YARICAP.m, paddingHorizontal: BOSLUK.l, alignItems: 'center', justifyContent: 'center' },
  dugmeYazi: { fontSize: 16, fontWeight: '600' },
  simgeDugme: { minWidth: DOKUNMA, minHeight: DOKUNMA, alignItems: 'center', justifyContent: 'center' },
  yuzen: {
    position: 'absolute', right: BOSLUK.l, bottom: BOSLUK.l, minWidth: 56, height: 56, borderRadius: 28, paddingHorizontal: BOSLUK.l,
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.2)',
  },
  cip: { borderWidth: 1, borderRadius: YARICAP.tam, paddingHorizontal: BOSLUK.m, alignItems: 'center', justifyContent: 'center' },
  cipSirasi: { flexDirection: 'row', flexWrap: 'wrap', gap: BOSLUK.s },
  etiket: { borderRadius: YARICAP.tam, paddingHorizontal: BOSLUK.s, paddingVertical: 2, alignSelf: 'flex-start', maxWidth: '100%' },
  alanEtiket: { fontSize: 13, fontWeight: '600' },
  girdi: { minHeight: DOKUNMA, borderWidth: 1, borderRadius: YARICAP.m, paddingHorizontal: BOSLUK.m, fontSize: 16 },
  kutu: { borderWidth: StyleSheet.hairlineWidth, borderRadius: YARICAP.l, padding: BOSLUK.l },
  bos: { alignItems: 'center', gap: BOSLUK.s, paddingVertical: 48, paddingHorizontal: BOSLUK.xl },
  perde: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sayfa: { borderTopLeftRadius: YARICAP.l, borderTopRightRadius: YARICAP.l, padding: BOSLUK.l, gap: BOSLUK.s, width: '100%', maxWidth: 640, alignSelf: 'center' },
});
