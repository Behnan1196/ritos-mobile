import { Text } from 'react-native';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { useRenkler } from '../../bilesen/tema';
import { AYAR, ayarOku } from '../../veri/depo';
import { useVeri } from '../../veri/olay';

const simge = (s: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>{s}</Text>
);

export default function SekmeDuzeni() {
  const r = useRenkler();
  const { veri: kurulum } = useVeri(() => ayarOku(AYAR.kurulumTamam, false), []);

  if (kurulum === undefined) return null;
  if (!kurulum) return <Redirect href="/hosgeldin" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: r.vurgu,
        tabBarInactiveTintColor: r.soluk,
        tabBarStyle: { backgroundColor: r.yuzey, borderTopColor: r.cizgi },
        headerStyle: { backgroundColor: r.yuzey },
        headerTintColor: r.yazi,
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ajandam', headerShown: false, tabBarIcon: simge('📅') }} />
      <Tabs.Screen name="rutinler" options={{ title: 'Rutinlerim', headerShown: false, tabBarIcon: simge('🌱') }} />
      <Tabs.Screen name="ayarlar" options={{ title: 'Ayarlar', tabBarIcon: simge('⚙️') }} />
    </Tabs>
  );
}
