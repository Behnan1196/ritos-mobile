// İlk açılış: karşılama → ilgilenilen yaşam alanları → (isteğe bağlı) ad. Hesap yok.

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { BOSLUK, DOKUNMA, YARICAP, useRenkler } from '../bilesen/tema';
import { Dugme, Girdi, Yazi } from '../bilesen/ui';
import { HAZIR_ALANLAR, hazirId } from '../mantik/alanlar';
import { kurulumuTamamla } from '../veri/depo';

export default function Hosgeldin() {
  const r = useRenkler();
  const ic = useSafeAreaInsets();
  const [adim, setAdim] = useState(0);
  const [secili, setSecili] = useState<string[]>([]);
  const [ad, setAd] = useState('');
  const [kayit, setKayit] = useState(false);

  const degistir = (id: string) => setSecili((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const bitir = async () => {
    setKayit(true);
    try {
      await kurulumuTamamla(secili, ad);
      router.replace('/');
    } finally {
      setKayit(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: r.zemin }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.icerik, { paddingTop: ic.top + 32, paddingBottom: ic.bottom + 32 }]}
      >
        <Text style={s.nokta}>{['●○○', '○●○', '○○●'][adim]}</Text>

        {adim === 0 && (
          <View style={s.blok}>
            <Text style={{ fontSize: 56 }}>🌿</Text>
            <Yazi kalin boyut={30}>Ritos'a hoş geldin</Yazi>
            <Yazi soluk boyut={17}>
              Günün ajandası, oturtmak istediğin rutinler ve yaşam alanlarının dengesi — hepsi tek yerde.
            </Yazi>
            <Yazi soluk boyut={15}>Hesap gerekmez. Her şey yalnız bu cihazda saklanır.</Yazi>
            <Dugme etiket="Başlayalım" onPress={() => setAdim(1)} stil={{ marginTop: BOSLUK.l }} />
          </View>
        )}

        {adim === 1 && (
          <View style={s.blok}>
            <Yazi kalin boyut={24}>Hangi alanlar seni ilgilendiriyor?</Yazi>
            <Yazi soluk boyut={15}>Seçmediklerin gizlenir; Ayarlar'dan istediğin zaman değiştirebilirsin.</Yazi>
            <View style={s.izgara}>
              {HAZIR_ALANLAR.map((a) => {
                const id = hazirId(a.kod);
                const on = secili.includes(id);
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={a.ad}
                    onPress={() => degistir(id)}
                    style={({ pressed }) => [
                      s.alan,
                      { backgroundColor: on ? r.vurguSoft : r.yuzey, borderColor: on ? r.vurgu : r.cizgi, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Text style={{ fontSize: 28 }}>{a.ikon}</Text>
                    <Yazi kalin boyut={15}>{a.ad}</Yazi>
                    <Yazi soluk boyut={12} satir={2}>{a.aciklama}</Yazi>
                    {on && <Text style={[s.tik, { color: r.vurgu }]}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>
            <Dugme
              etiket={secili.length ? `Devam (${secili.length})` : 'En az bir alan seç'}
              devreDisi={!secili.length}
              onPress={() => setAdim(2)}
            />
            <Dugme etiket="Geri" tur="metin" onPress={() => setAdim(0)} />
          </View>
        )}

        {adim === 2 && (
          <View style={s.blok}>
            <Yazi kalin boyut={24}>Sana nasıl seslenelim?</Yazi>
            <Yazi soluk boyut={15}>İstersen boş bırakabilirsin.</Yazi>
            <Girdi etiket="Adın" value={ad} onChangeText={setAd} placeholder="Ör. Ece" autoFocus returnKeyType="done" onSubmitEditing={bitir} maxLength={40} />
            <Dugme etiket="Bitir" onPress={bitir} devreDisi={kayit} />
            <Dugme etiket="Geri" tur="metin" onPress={() => setAdim(1)} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  icerik: { paddingHorizontal: BOSLUK.xl, width: '100%', maxWidth: 640, alignSelf: 'center', flexGrow: 1 },
  nokta: { textAlign: 'center', letterSpacing: 6, color: '#8a8a8a', marginBottom: BOSLUK.xl },
  blok: { gap: BOSLUK.m },
  izgara: { flexDirection: 'row', flexWrap: 'wrap', gap: BOSLUK.s, marginVertical: BOSLUK.s },
  alan: { width: '48%', flexGrow: 1, minHeight: DOKUNMA * 2.4, borderWidth: 1.5, borderRadius: YARICAP.l, padding: BOSLUK.m, gap: 2 },
  tik: { position: 'absolute', top: 8, right: 12, fontSize: 18, fontWeight: '700' },
});
