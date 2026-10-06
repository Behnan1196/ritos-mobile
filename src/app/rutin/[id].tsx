// Rutin detayı: bilgiler, kartlar, durum düğmeleri (Oturdu / Arşivle / Kuruluyor'a dön).

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { BOSLUK, DOKUNMA, YARICAP, useRenkler } from '../../bilesen/tema';
import { BolumBasligi, Cip, CipSirasi, Dugme, Etiket, Kutu, SecimPenceresi, Yazi, type Secenek } from '../../bilesen/ui';
import { DURUM_ETIKET } from '../../mantik/rutinDongu';
import { bugun, tarihEtiket } from '../../mantik/tarih';
import { zamanlamaOzeti } from '../../mantik/tekrar';
import { TIP_ETIKET, type Kart, type KartKalibi } from '../../mantik/tipler';
import { alanlariGetir, rutinArsivle, rutinGetir, rutinKartlari, rutinKuruluyoraDon, rutinOturdu } from '../../veri/depo';
import { useVeri } from '../../veri/olay';

export default function RutinDetay() {
  const r = useRenkler();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [onay, setOnay] = useState<{ baslik: string; mesaj: string; secenek: Secenek } | null>(null);

  const { veri } = useVeri(async () => {
    const [rutin, kartlar, alanlar] = await Promise.all([rutinGetir(id), rutinKartlari(id), alanlariGetir()]);
    return { rutin, kartlar, alanlar };
  }, [id]);

  if (!veri) return null;
  const { rutin, kartlar, alanlar } = veri;
  if (!rutin) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: r.zemin }}>
        <Stack.Screen options={{ title: 'Rutin' }} />
        <Yazi soluk>Bu rutin artık yok.</Yazi>
      </View>
    );
  }

  const t = bugun();
  const etkin = kartlar.filter((k) => k.bitis === null || k.bitis >= t);
  const biten = kartlar.filter((k) => k.bitis !== null && k.bitis < t);
  const etiketler = alanlar.filter((a) => rutin.alanlar.includes(a.id));

  const oturdu: Secenek = { etiket: 'Oturdu', onPress: () => rutinOturdu(rutin.id) };
  const arsivle: Secenek = { etiket: 'Arşivle', onPress: () => rutinArsivle(rutin.id) };
  const don: Secenek = { etiket: "Kuruluyor'a dön", onPress: () => rutinKuruluyoraDon(rutin.id) };

  return (
    <>
      <Stack.Screen
        options={{
          title: rutin.ad,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/rutin-duzenle', params: { id: rutin.id } })}
              style={{ minHeight: DOKUNMA, minWidth: DOKUNMA, justifyContent: 'center', paddingHorizontal: BOSLUK.s }}
            >
              <Text style={{ color: r.vurgu, fontSize: 16 }}>Düzenle</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView style={{ backgroundColor: r.zemin }} contentContainerStyle={s.icerik}>
        <Kutu stil={{ gap: BOSLUK.s }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: BOSLUK.m }}>
            <Text style={{ fontSize: 40 }}>{rutin.ikon}</Text>
            <View style={{ flex: 1, gap: 4 }}>
              <Yazi kalin boyut={20}>{rutin.ad}</Yazi>
              <Etiket metin={`${DURUM_ETIKET[rutin.durum]} · ${tarihEtiket(rutin.durum_tarih)}`} />
            </View>
          </View>
          {rutin.amac ? <Yazi boyut={15}>{rutin.amac}</Yazi> : null}
          {etiketler.length > 0 && (
            <CipSirasi>
              {etiketler.map((a) => <Cip key={a.id} etiket={`${a.ikon} ${a.ad}`} />)}
            </CipSirasi>
          )}
        </Kutu>

        <BolumBasligi>Durum</BolumBasligi>
        <View style={{ gap: BOSLUK.s }}>
          {rutin.durum === 'kuruluyor' && (
            <>
              <Dugme
                etiket="✓ Oturdu"
                onPress={() => setOnay({
                  baslik: 'Rutin oturdu mu?',
                  mesaj: 'Süregelen kartlar bugün biter ve ajandadan kalkar. Kalıpları saklanır; dengede bu rutinin alanlarına taban puan verir.',
                  secenek: oturdu,
                })}
              />
              <Dugme
                etiket="Arşivle"
                tur="ikincil"
                onPress={() => setOnay({ baslik: 'Rutin arşivlensin mi?', mesaj: 'Süregelen kartlar bugün biter ve ajandadan kalkar. Kalıpları saklanır.', secenek: arsivle })}
              />
            </>
          )}
          {rutin.durum === 'oturdu' && (
            <>
              <Dugme
                etiket="Kuruluyor'a dön"
                onPress={() => setOnay({ baslik: "Kuruluyor'a dönülsün mü?", mesaj: 'Saklanan kalıplardan yarından başlayan kartlar yeniden kurulur.', secenek: don })}
              />
              <Dugme etiket="Arşivle" tur="ikincil" onPress={() => setOnay({ baslik: 'Rutin arşivlensin mi?', mesaj: 'Dengede taban vermeyi bırakır.', secenek: arsivle })} />
            </>
          )}
          {rutin.durum === 'arsiv' && (
            <Dugme
              etiket="Yeniden başlat (Kuruluyor)"
              onPress={() => setOnay({ baslik: 'Rutin yeniden başlasın mı?', mesaj: 'Saklanan kalıplardan yarından başlayan kartlar kurulur.', secenek: don })}
            />
          )}
        </View>

        <BolumBasligi
          sag={rutin.durum === 'kuruluyor' ? (
            <Dugme etiket="＋ Kart" tur="metin" onPress={() => router.push({ pathname: '/kart', params: { rutin: rutin.id, tarih: t } })} />
          ) : undefined}
        >
          Kartlar
        </BolumBasligi>
        {etkin.length === 0 && rutin.durum === 'kuruluyor' && (
          <Yazi soluk boyut={14}>Henüz kart yok. ＋ Kart ile bu rutinin ajanda kartlarını ekle.</Yazi>
        )}
        {etkin.length === 0 && rutin.durum !== 'kuruluyor' && <Yazi soluk boyut={14}>Ajandada etkin kartı yok.</Yazi>}
        <View style={{ gap: BOSLUK.s }}>
          {etkin.map((k) => <KartSatiri key={k.id} kart={k} />)}
        </View>

        {rutin.durum !== 'kuruluyor' && rutin.kaliplar.length > 0 && (
          <>
            <BolumBasligi>Saklanan kalıplar</BolumBasligi>
            <View style={{ gap: BOSLUK.s }}>
              {rutin.kaliplar.map((k, i) => <KartSatiri key={i} kart={k} />)}
            </View>
          </>
        )}

        {biten.length > 0 && (
          <>
            <BolumBasligi>Biten kartlar</BolumBasligi>
            <View style={{ gap: BOSLUK.s }}>
              {biten.map((k) => <KartSatiri key={k.id} kart={k} soluk />)}
            </View>
          </>
        )}
      </ScrollView>

      <SecimPenceresi
        acik={!!onay}
        baslik={onay?.baslik ?? ''}
        mesaj={onay?.mesaj}
        secenekler={onay ? [onay.secenek] : []}
        kapat={() => setOnay(null)}
      />
    </>
  );
}

function KartSatiri({ kart, soluk }: { kart: Kart | KartKalibi; soluk?: boolean }) {
  const r = useRenkler();
  const id = 'id' in kart ? kart.id : null;
  const icerik = (
    <>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: soluk ? r.soluk : r.yazi, fontSize: 16 }} numberOfLines={1}>{kart.ad}</Text>
        <Text style={{ color: r.soluk, fontSize: 13 }}>{`${TIP_ETIKET[kart.tip]} · ${zamanlamaOzeti(kart)}`}</Text>
      </View>
      {id && <Text style={{ color: r.soluk, fontSize: 20 }}>›</Text>}
    </>
  );
  const stil = [s.kart, { backgroundColor: r.yuzey, borderColor: r.cizgi }];
  if (!id) return <View style={stil}>{icerik}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${kart.ad} kartını düzenle`}
      onPress={() => router.push({ pathname: '/kart', params: { id, tarih: bugun() } })}
      style={({ pressed }) => [...stil, { opacity: pressed ? 0.75 : 1 }]}
    >
      {icerik}
    </Pressable>
  );
}

const s = StyleSheet.create({
  icerik: { padding: BOSLUK.l, paddingBottom: 64, width: '100%', maxWidth: 720, alignSelf: 'center' },
  kart: { flexDirection: 'row', alignItems: 'center', gap: BOSLUK.m, padding: BOSLUK.m, borderRadius: YARICAP.m, borderWidth: StyleSheet.hairlineWidth, minHeight: DOKUNMA + 8 },
});
