import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Icon, PlayIcon } from '@/components/Icon';
import { PropertyMap, type Pinned } from '@/components/PropertyMap';
import { Sheet } from '@/components/Sheet';
import { SavingsBadge } from '@/components/SavingsBadge';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { api, imageUrl } from '@/api';
import { discountLabel, fmt, initialsOf, monthlyPayment, perM2Label, priceLabel } from '@/format';
import { useApp } from '@/state/AppState';
import { c, ICON } from '@/theme';
import type { Listing } from '@/types';

const VERIFY = [
  'Видео-тур снят по чек-листу',
  'Nota simple: собственник совпадает',
  'Обременений нет',
  'Личность агента подтверждена',
];

export default function ListingScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, isFavorite, toggleFavorite, listings } = useApp();

  // Пока грузится карточка, показываем то, что уже есть в списке — без пустого экрана.
  const cached = listings.find((l) => l.slug === slug);
  const [listing, setListing] = useState<Listing | null>(cached ?? null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [callOpen, setCallOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api
      .listing(slug)
      .then(setListing)
      .catch(() => undefined);
  }, [slug]);

  const gallery = useMemo(
    () => (listing ? [listing.coverImage, ...listing.gallery] : []),
    [listing],
  );

  if (!listing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={c.violet} />
      </View>
    );
  }

  const fav = isFavorite(listing.id);
  const { monthly } = monthlyPayment(listing.price, 30, 25);
  // В аренде экономия не показывается: рыночная цена задана для продажи.
  const savings = mode === 'buy' ? (listing.savings ?? null) : null;
  const facts = [
    { value: String(listing.area), label: 'м²' },
    { value: String(listing.bedrooms), label: 'спальни' },
    { value: String(listing.bathrooms), label: 'ванные' },
    { value: listing.seaDistance ?? '—', label: 'до моря' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Image source={{ uri: imageUrl(gallery[photoIndex % gallery.length]) }} style={styles.heroImage} />

          {/* Невидимые половины кадра листают галерею — как в макете. */}
          <Pressable
            style={styles.heroPrev}
            onPress={() => setPhotoIndex((i) => (i - 1 + gallery.length) % gallery.length)}
          />
          <Pressable
            style={styles.heroNext}
            onPress={() => setPhotoIndex((i) => (i + 1) % gallery.length)}
          />

          <View style={[styles.heroBar, { top: insets.top + 6 }]}>
            <Pressable onPress={() => router.back()} style={styles.heroBtn}>
              <Icon d={ICON.chevronLeft} size={20} width={2.2} />
            </Pressable>
            <View style={styles.heroActions}>
              <Pressable style={styles.heroBtn}>
                <Icon d={ICON.share} size={18} width={2} />
              </Pressable>
              <Pressable onPress={() => toggleFavorite(listing.id)} style={styles.heroBtn}>
                <Svg width={19} height={19} viewBox="0 0 24 24">
                  <Path
                    d={ICON.heart}
                    fill={fav ? c.coral : 'none'}
                    stroke={fav ? c.coral : c.ink}
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>
            </View>
          </View>

          {listing.videoTour && (
            <View style={styles.heroTagLeft}>
              <PlayIcon size={11} />
              <Text style={styles.heroTagText}>Видео-тур</Text>
            </View>
          )}
          <View style={styles.heroTagRight}>
            <Text style={styles.heroTagText}>
              {(photoIndex % gallery.length) + 1} / {gallery.length}
            </Text>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.priceRow}>
            <View>
              <View style={styles.priceLine}>
                <Text style={styles.price}>{priceLabel(listing.price, mode)}</Text>
                {savings && <SavingsBadge savings={savings} size="md" />}
              </View>
              <Text style={styles.perM2}>{perM2Label(listing, mode)}</Text>
            </View>
            {listing.verified && <VerifiedBadge size="lg" tinted />}
          </View>

          {/* Три строки вместо лозунга: обе цены и разница между ними.
              Обещание «дешевле рынка» должно быть проверяемым прямо здесь. */}
          {savings && listing.marketPrice && (
            <View style={styles.savings}>
              <View style={styles.savingsRow}>
                <Text style={styles.savingsLabel}>На Casaya</Text>
                <Text style={styles.savingsStrong}>{fmt(listing.price)}</Text>
              </View>
              <View style={styles.savingsRow}>
                <Text style={styles.savingsLabel}>Рыночная цена</Text>
                <Text style={styles.savingsMarket}>{fmt(listing.marketPrice)}</Text>
              </View>
              <View style={styles.savingsLine} />
              <View style={styles.savingsRow}>
                <Text style={styles.savingsAccentLabel}>Экономия</Text>
                <Text style={styles.savingsAccent}>
                  {fmt(savings.amount)} · {discountLabel(savings)}
                </Text>
              </View>
              <Text style={styles.savingsNote}>
                На Casaya объект держится в выдаче, только пока он дешевле рынка.
              </Text>
            </View>
          )}

          <View>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.address}>
              {listing.address}, {listing.city}
            </Text>
          </View>

          <View style={styles.facts}>
            {facts.map((f) => (
              <View key={f.label} style={styles.fact}>
                <Text style={styles.factValue}>{f.value}</Text>
                <Text style={styles.factLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={() => router.push('/mortgage')} style={styles.mortgage}>
            <Text style={styles.mortgageLabel}>Ипотека от</Text>
            <View style={styles.mortgageValueRow}>
              <Text style={styles.mortgageValue}>{fmt(monthly)} / мес</Text>
              <Icon d={ICON.chevronRight} size={16} color={c.greenDark} width={2.2} />
            </View>
          </Pressable>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Описание</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {listing.verified && (
            <View style={styles.verify}>
              <Text style={styles.verifyTitle}>Проверено Casaya Verify</Text>
              {VERIFY.map((v) => (
                <View key={v} style={styles.verifyRow}>
                  <Icon d={ICON.check} size={15} color={c.green} width={3} />
                  <Text style={styles.verifyText}>{v}</Text>
                </View>
              ))}
            </View>
          )}

          {listing.features.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Удобства</Text>
              <View style={styles.features}>
                {listing.features.map((f) => (
                  <View key={f} style={styles.feature}>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {listing.lat != null && listing.lng != null && (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>На карте</Text>
              <View style={styles.mapBox}>
                <PropertyMap compact mode={mode} pins={[listing as Pinned]} />
              </View>
            </View>
          )}

          <View style={styles.agent}>
            <View style={[styles.agentAvatar, { backgroundColor: listing.agency.brandColor }]}>
              <Text style={styles.agentInitials}>
                {listing.agency.initials || initialsOf(listing.agency.name)}
              </Text>
            </View>
            <View style={styles.agentBody}>
              <Text style={styles.agentName}>{listing.agency.name}</Text>
              <Text style={styles.agentMeta}>
                {listing.agency.verified ? 'Агентство проверено · ' : ''}отвечает за {listing.agency.replyTime} мин
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
        <Pressable onPress={() => router.push('/chat')} style={styles.actionSecondary}>
          <Text style={styles.actionSecondaryText}>Написать</Text>
        </Pressable>
        <Pressable onPress={() => setCallOpen(true)} style={styles.actionPrimary}>
          <Text style={styles.actionPrimaryText}>Позвонить</Text>
        </Pressable>
      </View>

      <Sheet open={callOpen} onClose={() => setCallOpen(false)}>
        <View style={styles.callAgent}>
          <View style={[styles.callAvatar, { backgroundColor: listing.agency.brandColor }]}>
            <Text style={styles.agentInitials}>
              {listing.agency.initials || initialsOf(listing.agency.name)}
            </Text>
          </View>
          <View>
            <Text style={styles.callName}>{listing.agency.name}</Text>
            <Text style={styles.callLangs}>Говорит на RU, EN, ES</Text>
          </View>
        </View>
        <Text style={styles.phone}>+34 965 12 48 30</Text>
        <Pressable onPress={() => setCallOpen(false)} style={styles.callBtn}>
          <Text style={styles.callBtnText}>Позвонить</Text>
        </Pressable>
        <Pressable onPress={() => setCallOpen(false)} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Отмена</Text>
        </Pressable>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.white },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.white },
  scroll: { paddingBottom: 140 },

  hero: { height: 380, backgroundColor: '#2A1F4A' },
  heroImage: { width: '100%', height: '100%' },
  heroPrev: { position: 'absolute', left: 0, top: 110, bottom: 40, width: '40%' },
  heroNext: { position: 'absolute', right: 0, top: 110, bottom: 40, width: '40%' },
  heroBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  heroActions: { flexDirection: 'row', gap: 8 },
  heroBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTagLeft: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(23,17,43,0.72)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  heroTagRight: {
    position: 'absolute',
    bottom: 40,
    right: 16,
    backgroundColor: 'rgba(23,17,43,0.72)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  heroTagText: { color: c.white, fontSize: 12, fontWeight: '600' },

  sheet: {
    marginTop: -24,
    backgroundColor: c.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 18,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  priceLine: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },

  savings: { borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 14, gap: 8 },
  savingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  savingsLabel: { fontSize: 14, color: c.grey },
  savingsStrong: { fontSize: 17, fontWeight: '700', color: c.ink },
  savingsMarket: { fontSize: 15, color: c.grey, textDecorationLine: 'line-through' },
  savingsLine: { height: 1, backgroundColor: c.lineSoft },
  savingsAccentLabel: { fontSize: 14, color: c.greenText },
  savingsAccent: { fontSize: 17, fontWeight: '700', color: c.greenText },
  savingsNote: { fontSize: 12, color: c.grey, lineHeight: 17 },
  price: { fontSize: 28, fontWeight: '700', letterSpacing: -1.1, color: c.ink },
  perM2: { fontSize: 14, color: c.grey, marginTop: 2 },
  title: { fontSize: 19, fontWeight: '600', letterSpacing: -0.4, color: c.ink },
  address: { fontSize: 14, color: c.grey, marginTop: 2 },

  facts: { flexDirection: 'row', gap: 8 },
  fact: { flex: 1, backgroundColor: c.surface, borderRadius: 14, paddingVertical: 11, alignItems: 'center' },
  factValue: { fontSize: 16, fontWeight: '700', color: c.ink },
  factLabel: { fontSize: 11, color: c.grey, marginTop: 2 },

  mortgage: {
    backgroundColor: c.greenTint,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mortgageLabel: { fontSize: 14, color: c.greenMid },
  mortgageValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mortgageValue: { fontSize: 16, fontWeight: '700', color: c.greenDark },

  block: { gap: 8 },
  blockTitle: { fontSize: 18, fontWeight: '700', color: c.ink },
  description: { fontSize: 15, lineHeight: 24, color: c.inkSoft },

  verify: {
    borderWidth: 1,
    borderColor: '#CFEEDF',
    backgroundColor: '#F2FBF7',
    borderRadius: 20,
    padding: 16,
    gap: 9,
  },
  verifyTitle: { fontSize: 15, fontWeight: '700', color: c.greenDark },
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifyText: { fontSize: 14, color: c.greenDark },

  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  feature: { borderWidth: 1, borderColor: c.lineStrong, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  featureText: { fontSize: 14, color: c.ink },

  mapBox: { height: 180, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: c.line },
  pin: {
    backgroundColor: c.violet,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pinText: { color: c.white, fontSize: 13, fontWeight: '700' },

  agent: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  agentAvatar: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  agentInitials: { color: c.white, fontWeight: '700', fontSize: 15 },
  agentBody: { flex: 1 },
  agentName: { fontSize: 15, fontWeight: '600', color: c.ink },
  agentMeta: { fontSize: 13, fontWeight: '500', color: c.green },

  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.white,
    borderTopWidth: 1,
    borderTopColor: c.line,
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
  },
  actionSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.lineStrong,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  actionSecondaryText: { fontSize: 16, fontWeight: '600', color: c.ink },
  actionPrimary: { flex: 1, backgroundColor: c.violet, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  actionPrimaryText: { fontSize: 16, fontWeight: '600', color: c.white },

  callAgent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  callAvatar: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  callName: { fontSize: 17, fontWeight: '700', color: c.ink },
  callLangs: { fontSize: 13, color: c.grey },
  phone: { fontSize: 30, fontWeight: '700', letterSpacing: -0.9, color: c.ink },
  callBtn: { backgroundColor: c.green, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  callBtnText: { color: c.white, fontSize: 16, fontWeight: '600' },
  cancelBtn: { backgroundColor: c.surfaceAlt, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  cancelBtnText: { color: c.ink, fontSize: 16, fontWeight: '600' },
});
