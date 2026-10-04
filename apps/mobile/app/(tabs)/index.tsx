import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FiltersSheet } from '@/components/FiltersSheet';
import { Icon } from '@/components/Icon';
import { ListingTile } from '@/components/ListingCards';
import { LoadState, Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { useI18n } from '@/i18n/I18nProvider';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { useApp } from '@/state/AppState';
import { c, ICON } from '@/theme';
import type { Filters } from '@/types';

/** Категории: иконки и цвета постоянные, подписи из словаря. */
const categories = (dict: Dictionary) => [
  { label: dict.home.catFlats, kind: 'FLAT' as const, bg: c.violetTint, fg: c.violet, icon: ICON.flat },
  { label: dict.home.catHouses, kind: 'HOUSE' as const, bg: c.coralTint, fg: c.coralDark, icon: ICON.house },
  { label: dict.home.catVillas, kind: 'VILLA' as const, bg: c.cyanTint, fg: c.cyan, icon: ICON.villa },
  { label: dict.home.catStudios, kind: 'STUDIO' as const, bg: c.greenTint, fg: c.greenText, icon: ICON.studio },
];

export default function HomeScreen() {
  const router = useRouter();
  const { listings, loading, error, reload, mode, setMode, setFilters, dealStep } = useApp();
  const { dict } = useI18n();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const openCategory = (kind: Filters['kind']) => {
    setFilters({ kind });
    router.push('/results');
  };

  return (
    <>
      <Screen>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{dict.home.greeting}</Text>
            <Text style={styles.title}>{dict.home.title}</Text>
          </View>
          <Pressable onPress={() => router.push('/chat')} style={styles.bell}>
            <Icon d={ICON.bell} size={20} width={1.8} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>

        <View style={styles.searchBlock}>
          <Pressable onPress={() => router.push('/results')} style={styles.searchBar}>
            <Icon d={ICON.search} size={20} color={c.muted} width={2} />
            <Text style={styles.searchPlaceholder}>{dict.home.searchPlaceholder}</Text>
            <Pressable onPress={() => setFiltersOpen(true)} hitSlop={6} style={styles.searchFilterBtn}>
              <Icon d={ICON.sliders} size={18} width={2} />
            </Pressable>
          </Pressable>

          <Segmented
            dark
            options={[
              { key: 'buy' as const, label: dict.home.modeBuy },
              { key: 'rent' as const, label: dict.home.modeRent },
            ]}
            value={mode}
            onChange={setMode}
          />
        </View>

        <View style={styles.categories}>
          {categories(dict).map((cat) => (
            <Pressable key={cat.label} onPress={() => openCategory(cat.kind)} style={styles.category}>
              <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
                <Icon d={cat.icon} size={26} color={cat.fg} width={1.8} />
              </View>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{dict.home.freshTitle}</Text>
          <Pressable onPress={() => router.push('/results')} hitSlop={8}>
            <Text style={styles.sectionLink}>{dict.home.seeAll}</Text>
          </Pressable>
        </View>

        <LoadState loading={loading} error={error} onRetry={reload} />

        {!loading && !error && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.feed}>
            {listings.slice(0, 5).map((item) => (
              <ListingTile key={item.id} item={item} mode={mode} />
            ))}
          </ScrollView>
        )}

        <View style={styles.promos}>
          <Pressable onPress={() => router.push('/mortgage')} style={styles.mortgageCard}>
            <View style={styles.mortgageIcon}>
              <Icon d={ICON.mortgage} size={20} color={c.white} width={1.8} />
            </View>
            <View style={styles.mortgageBody}>
              <Text style={styles.mortgageTitle}>{dict.home.mortgageTitle}</Text>
              <Text style={styles.mortgageText}>{dict.home.mortgageText}</Text>
            </View>
            <Icon d={ICON.chevronRight} size={18} color={c.white} width={2} />
          </Pressable>

          <View style={styles.promoRow}>
            <Pressable onPress={() => router.push('/deal')} style={[styles.promo, { backgroundColor: c.greenTint }]}>
              <Icon d={ICON.lock} size={22} color={c.greenText} width={1.9} />
              <View>
                <Text style={[styles.promoTitle, { color: c.greenDark }]}>{dict.home.dealTitle}</Text>
                <Text style={[styles.promoText, { color: c.greenMid }]}>
                  {dict.home.dealSteps.replace('{n}', String(dealStep))}
                </Text>
              </View>
            </Pressable>

            <Pressable onPress={() => router.push('/chat')} style={[styles.promo, { backgroundColor: c.coralTint }]}>
              <Icon d={ICON.video} size={22} color={c.coralDark} width={1.9} />
              <View>
                <Text style={styles.promoTitle}>{dict.home.viewingTitle}</Text>
                <Text style={[styles.promoText, { color: '#6B4A40' }]}>{dict.home.viewingText}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Screen>

      <FiltersSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 14, color: c.grey },
  title: { fontSize: 27, fontWeight: '700', letterSpacing: -1.2, color: c.ink, marginTop: 2 },
  bell: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: c.coral,
    borderWidth: 2,
    borderColor: c.surfaceAlt,
  },

  searchBlock: { paddingHorizontal: 20, gap: 10, marginTop: 20 },
  searchBar: {
    height: 56,
    borderRadius: 18,
    backgroundColor: c.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 16,
    paddingRight: 8,
  },
  searchPlaceholder: { flex: 1, fontSize: 16, color: c.greyLight },
  searchFilterBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: c.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categories: { paddingHorizontal: 20, flexDirection: 'row', gap: 10, marginTop: 20 },
  category: { flex: 1, alignItems: 'center', gap: 7 },
  categoryIcon: { width: '100%', aspectRatio: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: c.ink },

  sectionHead: {
    paddingHorizontal: 20,
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.6, color: c.ink },
  sectionLink: { fontSize: 14, fontWeight: '600', color: c.violet },

  feed: { gap: 12, paddingHorizontal: 20, paddingTop: 14 },

  promos: { paddingHorizontal: 20, gap: 10, marginTop: 22 },
  mortgageCard: {
    backgroundColor: c.violet,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  mortgageIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mortgageBody: { flex: 1 },
  mortgageTitle: { fontSize: 16, fontWeight: '700', color: c.white },
  mortgageText: { fontSize: 13, color: c.lilacBody, marginTop: 2 },

  promoRow: { flexDirection: 'row', gap: 10 },
  promo: { flex: 1, borderRadius: 22, padding: 16, gap: 22 },
  promoTitle: { fontSize: 15, fontWeight: '700', color: c.ink },
  promoText: { fontSize: 12, marginTop: 2 },
});
