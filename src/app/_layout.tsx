import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useKoyu, useRenkler } from '../bilesen/tema';
import { vt } from '../veri/db';

export default function KokDuzen() {
  const koyu = useKoyu();
  const r = useRenkler();
  const [hazir, setHazir] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    vt().then(
      () => setHazir(true),
      (e: unknown) => setHata(String(e)),
    );
  }, []);

  const temel = koyu ? DarkTheme : DefaultTheme;
  const tema = {
    ...temel,
    colors: { ...temel.colors, background: r.zemin, card: r.yuzey, text: r.yazi, border: r.cizgi, primary: r.vurgu },
  };

  if (!hazir) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: r.zemin, padding: 24 }}>
        {hata ? <Text style={{ color: r.tehlike, textAlign: 'center' }}>Veritabanı açılamadı: {hata}</Text> : <ActivityIndicator color={r.vurgu} />}
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={tema}>
        <StatusBar style={koyu ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerBackTitle: 'Geri' }}>
          <Stack.Screen name="(sekmeler)" options={{ headerShown: false }} />
          <Stack.Screen name="hosgeldin" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="rutin/[id]" options={{ title: 'Rutin' }} />
          <Stack.Screen name="kart" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="rutin-duzenle" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="alanlar" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="ad" options={{ headerShown: false, presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
