// Ajandam: gün şeridi + o günün kartları. Dokun = yapıldı, tekrar dokun = geri al.

import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { BOSLUK, DOKUNMA, YARICAP, useRenkler } from '../../bilesen/tema';
import { BosDurum, Etiket, SecimPenceresi, SimgeDugme, Yazi, YuzenDugme, type Secenek } from '../../bilesen/ui';
import { GUN_KISA, bugun, goreceliGun, tarihEkle, tarihEtiket, tarihParse } from '../../mantik/tarih';
import { gununKartlari, tekrarEder, zamanlamaOzeti } from '../../mantik/tekrar';
import { TIP_ETIKET, kayitId, type Kart, type Rutin } from '../../mantik/tipler';
import { AYAR, ayarOku, gunKayitlari, kartSil, rutinleriGetir, tarihKartlari, yapildiDegistir } from '../../veri/depo';
import { useVeri } from '../../veri/olay';

const GERI_GUN = 60;
const ILERI_GUN = 120;
const GUN_GENISLIK = 60;

export default function Ajandam() {
  const r = useRenkler();
  const ic = useSafeAreaInsets();
  const [simdi, setSimdi] = useState(bugun);
  const [tarih, setTarih] = useState(simdi);
  const [islem, setIslem] = useState<{ baslik: string; mesaj?: string; secenekler: Secenek[] } | null>(null);
  const serit = useRef<FlatList<string>>(null);

  // Gün döndüyse (uygulama gece açık kaldıysa) "bugün"ü tazele.
  useFocusEffect(
    useCallback(() => {
      const b = bugun();
      if (b !== simdi) {
        setSimdi(b);
        setTarih(b);
      }
    }, [simdi]),
  );

  const gunler = useMemo(
    () => Array.from({ length: GERI_GUN + ILERI_GUN + 1 }, (_, i) => tarihEkle(simdi, i - GERI_GUN)),
    [simdi],
  );

  const { veri } = useVeri(async () => {
    const [kartlar, kayitlar, rutinler, ad] = await Promise.all([
      tarihKartlari(tarih),
      gunKayitlari(tarih),
      rutinleriGetir(),
      ayarOku(AYAR.ad, ''),
    ]);
    return {
      kartlar: gununKartlari(kartlar, tarih),
      yapilan: new Set(kayitlar.filter((k) => k.yapildi).map((k) => k.id)),
      rutinler: new Map<string, Rutin>(rutinler.map((x) => [x.id, x])),
      ad,
    };
  }, [tarih]);

  const kartIslem = (k: Kart) => {
    const sil: Secenek[] = tekrarEder(k)
      ? [
          { etiket: 'Sil: yalnız bu gün', tehlike: true, onPress: () => kartSil(k.id, tarih, 'yalnizBuGun') },
          { etiket: 'Sil: bundan sonra', tehlike: true, onPress: () => kartSil(k.id, tarih, 'bundanSonra') },
        ]
      : [{ etiket: 'Sil', tehlike: true, onPress: () => kartSil(k.id, tarih, 'tumu') }];
    setIslem({
      baslik: k.ad,
      mesaj: zamanlamaOzeti(k),
      secenekler: [{ etiket: 'Düzenle', onPress: () => router.push({ pathname: '/kart', params: { id: k.id, tarih } }) }, ...sil],
    });
  };

  const yapilanSayisi = veri ? veri.kartlar.filter((k) => veri.yapilan.has(kayitId(k.id, tarih))).length : 0;

  return (
    <View style={{ flex: 1, backgroundColor: r.zemin, paddingTop: ic.top }}>
      <View style={s.ust}>
        <Yazi soluk boyut={14}>{veri?.ad ? `Merhaba ${veri.ad}` : 'Merhaba'}</Yazi>
        <Yazi kalin boyut={26} stil={{ marginTop: 2 }} >{tarihEtiket(tarih)}</Yazi>
        {veri && veri.kartlar.length > 0 && (
          <Yazi soluk boyut={14}>{`${yapilanSayisi} / ${veri.kartlar.length} yapıldı`}</Yazi>
        )}
      </View>

      <View>
        <FlatList
          ref={serit}
          horizontal
          data={gunler}
          keyExtractor={(t) => t}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={GERI_GUN - 1}
          getItemLayout={(_, i) => ({ length: GUN_GENISLIK, offset: GUN_GENISLIK * i, index: i })}
          contentContainerStyle={{ paddingHorizontal: BOSLUK.s }}
          renderItem={({ item: t }) => {
            const secili = t === tarih;
            const gor = goreceliGun(t, simdi);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: secili }}
                accessibilityLabel={`${gor ?? ''} ${tarihEtiket(t)}`.trim()}
                onPress={() => setTarih(t)}
                style={[s.gun, { backgroundColor: secili ? r.vurgu : 'transparent' }]}
              >
                <Text style={{ fontSize: 12, color: secili ? r.vurguYazi : r.soluk }} numberOfLines={1}>
                  {gor ?? GUN_KISA[tarihParse(t).getDay()]}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '600', color: secili ? r.vurguYazi : t === simdi ? r.vurgu : r.yazi }}>
                  {tarihParse(t).getDate()}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={veri?.kartlar ?? []}
        keyExtractor={(k) => k.id}
        contentContainerStyle={{ padding: BOSLUK.l, paddingBottom: 120, gap: BOSLUK.s, width: '100%', maxWidth: 720, alignSelf: 'center' }}
        ListEmptyComponent={
          veri ? (
            <BosDurum simge="☀️" baslik="Bu gün için kart yok" aciklama="＋ ile bir kart ekleyebilirsin." />
          ) : null
        }
        renderItem={({ item: k }) => {
          const yapildi = !!veri?.yapilan.has(kayitId(k.id, tarih));
          const rutin = k.rutin_id ? veri?.rutinler.get(k.rutin_id) : undefined;
          return (
            <View style={[s.kart, { backgroundColor: r.yuzey, borderColor: r.cizgi }]}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: yapildi }}
                accessibilityLabel={k.ad}
                accessibilityHint={yapildi ? 'Geri almak için dokun' : 'Yapıldı işaretlemek için dokun'}
                onPress={() => yapildiDegistir(k.id, tarih)}
                style={({ pressed }) => [s.kartGovde, { opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={[s.kutucuk, { borderColor: yapildi ? r.basari : r.cizgi, backgroundColor: yapildi ? r.basari : 'transparent' }]}>
                  {yapildi && <Text style={{ color: r.vurguYazi, fontWeight: '700' }}>✓</Text>}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{ fontSize: 16, color: yapildi ? r.soluk : r.yazi, textDecorationLine: yapildi ? 'line-through' : 'none' }}
                    numberOfLines={2}
                  >
                    {k.ad}
                  </Text>
                  <View style={s.meta}>
                    {k.saatler[0] ? <Text style={[s.metaYazi, { color: r.yazi }]}>{k.saatler.join(', ')}</Text> : null}
                    <Text style={[s.metaYazi, { color: r.soluk }]}>{TIP_ETIKET[k.tip]}</Text>
                    {tekrarEder(k) && <Text style={[s.metaYazi, { color: r.soluk }]}>↻</Text>}
                    {rutin && <Etiket metin={`${rutin.ikon} ${rutin.ad}`} />}
                  </View>
                  {k.aciklama ? <Text style={{ color: r.soluk, fontSize: 14 }} numberOfLines={2}>{k.aciklama}</Text> : null}
                </View>
              </Pressable>
              <SimgeDugme simge="⋯" erisim={`${k.ad} için işlemler`} onPress={() => kartIslem(k)} renk={r.soluk} />
            </View>
          );
        }}
      />

      <YuzenDugme erisim="Kart ekle" onPress={() => router.push({ pathname: '/kart', params: { tarih } })} />

      <SecimPenceresi
        acik={!!islem}
        baslik={islem?.baslik ?? ''}
        mesaj={islem?.mesaj}
        secenekler={islem?.secenekler ?? []}
        kapat={() => setIslem(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  ust: { paddingHorizontal: BOSLUK.l, paddingTop: BOSLUK.m, paddingBottom: BOSLUK.s },
  gun: { width: GUN_GENISLIK - 6, marginHorizontal: 3, minHeight: 56, borderRadius: YARICAP.m, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  kart: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: YARICAP.l, paddingLeft: BOSLUK.m },
  kartGovde: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: BOSLUK.m, paddingVertical: BOSLUK.m, minHeight: DOKUNMA + 12 },
  kutucuk: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: BOSLUK.s },
  metaYazi: { fontSize: 13 },
});
