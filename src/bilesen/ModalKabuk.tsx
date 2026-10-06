// Form modallarının ortak kabuğu: üstte Vazgeç / başlık / Kaydet, altında kaydırılan içerik.

import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { BOSLUK, DOKUNMA, useRenkler } from './tema';

export function ModalKabuk({ baslik, children, kaydet, kaydetEtiket = 'Kaydet', kaydetDevreDisi }: {
  baslik: string;
  children: ReactNode;
  kaydet?: () => void;
  kaydetEtiket?: string;
  kaydetDevreDisi?: boolean;
}) {
  const r = useRenkler();
  const ic = useSafeAreaInsets();
  // iOS sayfa modalı üst güvenli alanı kendisi bırakır; web ve Android'de biz bırakırız.
  const ust = Platform.OS === 'ios' ? BOSLUK.s : ic.top + BOSLUK.s;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: r.zemin }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.ust, { paddingTop: ust, borderBottomColor: r.cizgi, backgroundColor: r.yuzey }]}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={s.ustDugme}>
          <Text style={{ color: r.vurgu, fontSize: 16 }}>{kaydet ? 'Vazgeç' : 'Kapat'}</Text>
        </Pressable>
        <Text style={[s.baslik, { color: r.yazi }]} numberOfLines={1} accessibilityRole="header">{baslik}</Text>
        {kaydet ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !!kaydetDevreDisi }}
            disabled={kaydetDevreDisi}
            onPress={kaydet}
            style={[s.ustDugme, { alignItems: 'flex-end', opacity: kaydetDevreDisi ? 0.4 : 1 }]}
          >
            <Text style={{ color: r.vurgu, fontSize: 16, fontWeight: '700' }}>{kaydetEtiket}</Text>
          </Pressable>
        ) : (
          <View style={s.ustDugme} />
        )}
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.icerik, { paddingBottom: ic.bottom + 48 }]}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  ust: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: BOSLUK.s, paddingBottom: BOSLUK.xs, borderBottomWidth: StyleSheet.hairlineWidth },
  ustDugme: { minWidth: 84, minHeight: DOKUNMA, justifyContent: 'center', paddingHorizontal: BOSLUK.s },
  baslik: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  icerik: { padding: BOSLUK.l, gap: BOSLUK.l, width: '100%', maxWidth: 640, alignSelf: 'center' },
});
