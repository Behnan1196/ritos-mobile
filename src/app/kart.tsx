// Kart ekle / düzenle modalı. Parametreler: id (düzenleme), tarih (ajandada seçili gün), rutin (rutinden eklerken).

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ModalKabuk } from '../bilesen/ModalKabuk';
import { BOSLUK, useRenkler } from '../bilesen/tema';
import { AlanEtiketi, Cip, CipSirasi, Dugme, Girdi, SecimPenceresi, Yazi, type Secenek } from '../bilesen/ui';
import { GUN_KISA, HAFTA_SIRASI, bugun, gecerliTarih, saatDuzelt, tarihEkle, tarihEtiket } from '../mantik/tarih';
import { tekrarEder, tekrarTuru, zamanlamaKur, type TekrarTuru } from '../mantik/tekrar';
import { TIPLER, TIP_ETIKET, type Kart, type Rutin, type TemelTip } from '../mantik/tipler';
import { kartGetir, kartKaydet, kartSil, rutinleriGetir } from '../veri/depo';

const TEKRAR: [TekrarTuru, string][] = [
  ['tek', 'Yalnız bu gün'],
  ['her', 'Her gün'],
  ['gunler', 'Seçili günler'],
];

export default function KartModal() {
  const r = useRenkler();
  const p = useLocalSearchParams<{ id?: string; tarih?: string; rutin?: string }>();
  const duzenleme = !!p.id;
  const gun = p.tarih && gecerliTarih(p.tarih) ? p.tarih : bugun();

  const [yuklendi, setYuklendi] = useState(!duzenleme);
  const [ad, setAd] = useState('');
  const [tip, setTip] = useState<TemelTip>('yap');
  const [aciklama, setAciklama] = useState('');
  const [tur, setTur] = useState<TekrarTuru>(p.rutin ? 'her' : 'tek');
  const [baslangic, setBaslangic] = useState(gun);
  const [gunler, setGunler] = useState<number[]>([]);
  const [saat, setSaat] = useState('');
  const [bitis, setBitis] = useState('');
  const [rutinId, setRutinId] = useState<string | null>(p.rutin ?? null);
  const [rutinler, setRutinler] = useState<Rutin[]>([]);
  const [silSecimi, setSilSecimi] = useState<Secenek[] | null>(null);
  const [denendi, setDenendi] = useState(false);
  const [ozgun, setOzgun] = useState<Kart | null>(null);

  useEffect(() => {
    rutinleriGetir().then(setRutinler);
    if (!p.id) return;
    kartGetir(p.id).then((k) => {
      if (!k) return router.back();
      setOzgun(k);
      setAd(k.ad);
      setTip(k.tip);
      setAciklama(k.aciklama);
      const t = tekrarTuru(k);
      setTur(t);
      setBaslangic(k.baslangic);
      setGunler(k.gunler ?? []);
      setSaat(k.saatler[0] ?? '');
      setBitis(t !== 'tek' && k.bitis ? k.bitis : '');
      setRutinId(k.rutin_id);
      setYuklendi(true);
    });
  }, [p.id]);

  const saatNorm = saat.trim() ? saatDuzelt(saat) : '';
  const hataAd = denendi && !ad.trim() ? 'Bir ad yaz.' : null;
  const hataBaslangic = !gecerliTarih(baslangic) ? 'Tarih YYYY-AA-GG biçiminde olmalı.' : null;
  const hataSaat = saatNorm === null ? 'Saat SS:DD biçiminde olmalı (ör. 07:30).' : null;
  const hataBitis = tur !== 'tek' && bitis.trim()
    ? !gecerliTarih(bitis.trim()) ? 'Tarih YYYY-AA-GG biçiminde olmalı.' : bitis.trim() < baslangic ? 'Bitiş, başlangıçtan önce olamaz.' : null
    : null;
  const hataGunler = tur === 'gunler' && gunler.length === 0 ? 'En az bir gün seç.' : null;
  const gecerli = !!ad.trim() && !hataBaslangic && !hataSaat && !hataBitis && !hataGunler;

  const kaydet = async () => {
    setDenendi(true);
    if (!gecerli) return;
    const z = zamanlamaKur(tur, baslangic, gunler, tur === 'tek' ? null : bitis.trim() || null);
    await kartKaydet(
      { tip, ad: ad.trim(), aciklama: aciklama.trim(), ...z, saatler: saatNorm ? [saatNorm] : [], rutin_id: rutinId },
      p.id,
    );
    router.back();
  };

  const sil = () => {
    if (!p.id || !ozgun) return;
    const id = p.id;
    const bitir = (fn: Promise<void>) => fn.then(() => router.back());
    setSilSecimi(
      tekrarEder(ozgun)
        ? [
            { etiket: `Yalnız bu gün (${tarihEtiket(gun)})`, tehlike: true, onPress: () => bitir(kartSil(id, gun, 'yalnizBuGun')) },
            { etiket: 'Bundan sonra', tehlike: true, onPress: () => bitir(kartSil(id, gun, 'bundanSonra')) },
          ]
        : [{ etiket: 'Kartı sil', tehlike: true, onPress: () => bitir(kartSil(id, gun, 'tumu')) }],
    );
  };

  const gunDegistir = (g: number) => setGunler((x) => (x.includes(g) ? x.filter((y) => y !== g) : [...x, g]));
  const secilebilirRutinler = rutinler.filter((x) => x.durum === 'kuruluyor' || x.id === rutinId);

  if (!yuklendi) return <ModalKabuk baslik="Kart">{null}</ModalKabuk>;

  return (
    <ModalKabuk baslik={duzenleme ? 'Kartı düzenle' : 'Yeni kart'} kaydet={kaydet} kaydetDevreDisi={denendi && !gecerli}>
      <Girdi etiket="Ad" value={ad} onChangeText={setAd} placeholder="Ör. 20 dk yürüyüş" autoFocus={!duzenleme} hata={hataAd} maxLength={120} />

      <View style={{ gap: BOSLUK.s }}>
        <AlanEtiketi>Tip</AlanEtiketi>
        <CipSirasi>
          {TIPLER.map((t) => <Cip key={t} etiket={TIP_ETIKET[t]} secili={tip === t} onPress={() => setTip(t)} />)}
        </CipSirasi>
      </View>

      <Girdi etiket="Açıklama" value={aciklama} onChangeText={setAciklama} placeholder="İsteğe bağlı" multiline />

      <View style={{ gap: BOSLUK.s }}>
        <AlanEtiketi>Tekrar</AlanEtiketi>
        <CipSirasi>
          {TEKRAR.map(([t, e]) => <Cip key={t} etiket={e} secili={tur === t} onPress={() => setTur(t)} />)}
        </CipSirasi>
        {tur === 'gunler' && (
          <>
            <CipSirasi>
              {HAFTA_SIRASI.map((g) => <Cip key={g} etiket={GUN_KISA[g]!} secili={gunler.includes(g)} onPress={() => gunDegistir(g)} />)}
            </CipSirasi>
            {denendi && hataGunler ? <Yazi boyut={13} stil={{ color: r.tehlike }}>{hataGunler}</Yazi> : null}
          </>
        )}
      </View>

      <Girdi
        etiket={tur === 'tek' ? 'Tarih' : 'Başlangıç'}
        value={baslangic}
        onChangeText={setBaslangic}
        placeholder="YYYY-AA-GG"
        autoCapitalize="none"
        hata={hataBaslangic}
        ipucu={gecerliTarih(baslangic) ? tarihEtiket(baslangic) : undefined}
        maxLength={10}
      />

      <Girdi
        etiket="Saat (isteğe bağlı)"
        value={saat}
        onChangeText={setSaat}
        placeholder="Ör. 07:30"
        keyboardType="numbers-and-punctuation"
        hata={hataSaat}
        maxLength={5}
      />

      {tur !== 'tek' && (
        <View style={{ gap: BOSLUK.s }}>
          <Girdi
            etiket="Bitiş tarihi (isteğe bağlı)"
            value={bitis}
            onChangeText={setBitis}
            placeholder="Boş = süregelen"
            autoCapitalize="none"
            hata={hataBitis}
            ipucu={bitis && gecerliTarih(bitis) ? tarihEtiket(bitis) : 'Boş bırakırsan kart süregelir.'}
            maxLength={10}
          />
          <CipSirasi>
            <Cip etiket="Süregelen" secili={!bitis} onPress={() => setBitis('')} />
            <Cip etiket="1 hafta" onPress={() => setBitis(tarihEkle(baslangic, 6))} />
            <Cip etiket="1 ay" onPress={() => setBitis(tarihEkle(baslangic, 29))} />
            <Cip etiket="3 ay" onPress={() => setBitis(tarihEkle(baslangic, 89))} />
          </CipSirasi>
        </View>
      )}

      <View style={{ gap: BOSLUK.s }}>
        <AlanEtiketi>Rutin</AlanEtiketi>
        <CipSirasi>
          <Cip etiket="Rutinsiz" secili={rutinId === null} onPress={() => setRutinId(null)} />
          {secilebilirRutinler.map((x) => (
            <Cip key={x.id} etiket={`${x.ikon} ${x.ad}`} secili={rutinId === x.id} onPress={() => setRutinId(x.id)} />
          ))}
        </CipSirasi>
      </View>

      {duzenleme && <Dugme etiket="Kartı sil" tur="tehlike" onPress={sil} stil={{ marginTop: BOSLUK.l }} />}

      <SecimPenceresi
        acik={!!silSecimi}
        baslik="Kartı sil"
        mesaj={silSecimi && silSecimi.length > 1 ? 'Bu kart tekrar ediyor. Ne kadarını silelim?' : 'Bu kart silinsin mi?'}
        secenekler={silSecimi ?? []}
        kapat={() => setSilSecimi(null)}
      />
    </ModalKabuk>
  );
}
