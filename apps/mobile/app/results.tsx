import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '@/components/Chip';
import { FiltersSheet, kindChips } from '@/components/FiltersSheet';
import { Icon } from '@/components/Icon';
import { ListingCard } from '@/components/ListingCards';
import { LoadState, Screen } from '@/components/Screen';
import { countLabel } from '@/format';
import { useI18n } from '@/i18n/I18nProvider';
import { useApp } from '@/state/AppState';
import { c, ICON } from '@/theme';

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filtered, loading, error, reload, mode, filters, setFilters, resetFilters } = useApp();
  const { locale, dict } = useI18n();
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <>
      <Screen>
        <View style={styles.searchRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Icon d={ICON.chevronLeft} size={20} width={2.2} />
          </Pressable>
          <View style={styles.searchBar}>
            <Icon d={ICON.search} size={18} color={c.muted} width={2} />
            <Text style={styles.searchText}>
              {dict.results.searchLabel.replace(
                '{mode}',
                mode === 'rent' ? dict.results.modeRent : dict.results.modeBuy,
              )}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable onPress={() => setFiltersOpen(true)} style={styles.filtersBtn}>
            <Icon d={ICON.sliders} size={14} color={c.white} width={2.2} />
            <Text style={styles.filtersBtnText}>{dict.results.filters}</Text>
          </Pressable>
          {kindChips(dict).map((k) => (
            <Chip key={k.key} label={k.label} active={filters.kind === k.key} onPress={() => setFilters({ kind: k.key })} />
          ))}
        </ScrollView>

        <View style={styles.countRow}>
          <Text style={styles.count}>{countLabel(filtered.length, locale, dict)}</Text>
          <Text style={styles.sort}>{dict.results.sort}</Text>
        </View>

        <LoadState loading={loading} error={error} onRetry={reload} />

        <View style={styles.list}>
          {filtered.map((item) => (
            <ListingCard key={item.id} item={item} mode={mode} />
          ))}

          {!loading && !error && filtered.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{dict.results.emptyTitle}</Text>
              <Text style={styles.emptyText}>{dict.results.emptyText}</Text>
              <Pressable onPress={resetFilters} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>{dict.results.reset}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Screen>

      <Pressable
        onPress={() => router.replace('/map')}
        style={[styles.mapFab, { bottom: Math.max(insets.bottom, 12) + 96 }]}
      >
        <Icon d={ICON.layers} size={18} color={c.white} width={1.9} />
        <Text style={styles.mapFabText}>{dict.results.onMap}</Text>
      </Pressable>

      <FiltersSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  searchRow: { paddingHorizontal: 20, flexDirection: 'row', gap: 10, alignItems: 'center' },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    backgroundColor: c.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  searchText: { fontSize: 15, color: c.ink },

  chips: { gap: 8, paddingHorizontal: 20, paddingTop: 14 },
  filtersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: c.ink,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  filtersBtnText: { color: c.white, fontSize: 14, fontWeight: '600' },

  countRow: {
    paddingHorizontal: 20,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: { fontSize: 14, color: c.muted },
  sort: { fontSize: 14, fontWeight: '600', color: c.ink },

  list: { paddingHorizontal: 20, paddingTop: 12, gap: 22 },

  empty: { backgroundColor: c.surface, borderRadius: 22, paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: c.ink },
  emptyText: { fontSize: 14, color: c.muted },
  emptyBtn: { backgroundColor: c.violet, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18 },
  emptyBtnText: { color: c.white, fontSize: 15, fontWeight: '600' },

  mapFab: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.ink,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 20,
    shadowColor: c.ink,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  mapFabText: { color: c.white, fontSize: 15, fontWeight: '600' },
});
