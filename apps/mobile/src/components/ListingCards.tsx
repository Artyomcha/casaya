import { Image } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FavoriteButton } from './FavoriteButton';
import { PlayIcon } from './Icon';
import { PriceWithMarket, SavingsBadge } from './SavingsBadge';
import { VerifiedBadge } from './VerifiedBadge';
import { imageUrl } from '@/api';
import { useI18n } from '@/i18n/I18nProvider';
import { money, perM2Label, priceLabel, specsOf } from '@/format';
import { c } from '@/theme';
import type { Listing, Mode } from '@/types';

const useOpen = (slug: string) => {
  const router = useRouter();
  return () => router.push(`/listing/${slug}`);
};

/** Узкая карточка для горизонтальной ленты на главной. */
export function ListingTile({ item, mode }: { item: Listing; mode: Mode }) {
  const open = useOpen(item.slug);
  const { locale, dict } = useI18n();

  return (
    <Pressable onPress={open} style={styles.tile}>
      <View style={styles.tileMedia}>
        <Image source={{ uri: imageUrl(item.coverImage) }} style={styles.image} />
        <View style={styles.badgeTopLeft}>
          {item.savings && mode === 'buy' && <SavingsBadge savings={item.savings} />}
          {item.verified && <VerifiedBadge size="sm" />}
        </View>
        <FavoriteButton listingId={item.id} size={17} />
      </View>
      <View>
        <Text style={styles.tilePrice}>{priceLabel(item.price, mode, locale, dict)}</Text>
        <Text style={styles.specs}>{specsOf(item, locale, dict)}</Text>
        <Text style={styles.address}>{item.address}</Text>
      </View>
    </Pressable>
  );
}

/** Большая карточка выдачи. */
export function ListingCard({ item, mode }: { item: Listing; mode: Mode }) {
  const open = useOpen(item.slug);
  const { locale, dict } = useI18n();

  return (
    <Pressable onPress={open} style={styles.card}>
      <View style={styles.cardMedia}>
        <Image source={{ uri: imageUrl(item.coverImage) }} style={styles.image} />
        <View style={styles.badgeTopLeftLarge}>
          {item.savings && mode === 'buy' && <SavingsBadge savings={item.savings} />}
          {item.verified && <VerifiedBadge size="md" />}
        </View>
        <FavoriteButton listingId={item.id} size={18} />
        {item.videoTour && (
          <View style={styles.videoTag}>
            <PlayIcon size={10} />
            <Text style={styles.videoTagText}>{dict.common.videoTour}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.cardFooterMain}>
          <PriceWithMarket
            price={priceLabel(item.price, mode, locale, dict)}
            marketPrice={mode === 'buy' && item.marketPrice ? money(item.marketPrice, locale) : null}
            priceStyle={styles.cardPrice}
          />
          <Text style={styles.specsLarge}>{specsOf(item, locale, dict)}</Text>
          <Text style={styles.addressLarge}>{item.address}</Text>
        </View>
        <Text style={styles.perM2}>{perM2Label(item, mode, locale, dict)}</Text>
      </View>
    </Pressable>
  );
}

/** Горизонтальная строка — избранное. */
export function ListingRow({ item, mode }: { item: Listing; mode: Mode }) {
  const open = useOpen(item.slug);
  const { locale, dict } = useI18n();

  return (
    <Pressable onPress={open} style={styles.row}>
      <Image source={{ uri: imageUrl(item.coverImage) }} style={styles.rowImage} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <PriceWithMarket
            price={priceLabel(item.price, mode, locale, dict)}
            marketPrice={mode === 'buy' && item.marketPrice ? money(item.marketPrice, locale) : null}
            priceStyle={styles.rowPrice}
          />
          <FavoriteButton listingId={item.id} variant="plain" size={20} />
        </View>
        <Text style={styles.specs}>{specsOf(item, locale, dict)}</Text>
        <Text style={styles.address}>{item.address}</Text>
        {item.badge && (
          <View style={styles.rowBadge}>
            <Text style={styles.rowBadgeText}>{item.badge}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },

  tile: { width: 250, gap: 10 },
  tileMedia: { height: 170, borderRadius: 20, overflow: 'hidden', backgroundColor: c.violetTintSoft },
  tilePrice: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4, color: c.ink },

  card: { gap: 10 },
  cardMedia: { height: 220, borderRadius: 22, overflow: 'hidden', backgroundColor: c.violetTintSoft },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cardFooterMain: { flex: 1 },
  cardPrice: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5, color: c.ink },

  badgeTopLeft: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 5, alignItems: 'center' },
  badgeTopLeftLarge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6, alignItems: 'center' },

  videoTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(23,17,43,0.72)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  videoTagText: { color: c.white, fontSize: 12, fontWeight: '600' },

  specs: { fontSize: 13, color: c.inkSoft, marginTop: 2 },
  address: { fontSize: 13, color: c.grey, marginTop: 1 },
  specsLarge: { fontSize: 14, color: c.inkSoft, marginTop: 3 },
  addressLarge: { fontSize: 14, color: c.grey, marginTop: 2 },
  perM2: { fontSize: 13, color: c.grey },

  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 22,
    padding: 10,
  },
  rowImage: { width: 110, height: 110, borderRadius: 15 },
  rowBody: { flex: 1, paddingVertical: 4, gap: 3 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowPrice: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4, color: c.ink },
  rowBadge: {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    backgroundColor: c.greenTint,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  rowBadgeText: { color: c.greenText, fontSize: 11, fontWeight: '700' },
});
