import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip } from './Chip';
import { RangeRow } from './RangeRow';
import { Segmented } from './Segmented';
import { Sheet } from './Sheet';
import { countLabel, money } from '@/format';
import { useI18n } from '@/i18n/I18nProvider';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { useApp } from '@/state/AppState';
import { c } from '@/theme';
import { NO_PRICE_LIMIT, type Filters } from '@/types';

/** Подписи приходят из словаря: список типов один, язык разный. */
export const kindChips = (dict: Dictionary): { key: Filters['kind']; label: string }[] => [
  { key: 'all', label: dict.common.all },
  { key: 'FLAT', label: dict.home.catFlats },
  { key: 'HOUSE', label: dict.home.catHouses },
  { key: 'VILLA', label: dict.home.catVillas },
  { key: 'STUDIO', label: dict.home.catStudios },
];

const bedroomOptions = (dict: Dictionary) => [
  { key: 0, label: dict.filters.any },
  { key: 1, label: '1+' },
  { key: 2, label: '2+' },
  { key: 3, label: '3+' },
  { key: 4, label: '4+' },
];

export function FiltersSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mode, setMode, filters, setFilters, resetFilters, filtered } = useApp();
  const { locale, dict } = useI18n();

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>{dict.filters.title}</Text>
        <Pressable onPress={resetFilters} hitSlop={8}>
          <Text style={styles.reset}>{dict.filters.reset}</Text>
        </Pressable>
      </View>

      <Segmented
        dark
        options={[
          { key: 'buy' as const, label: dict.home.modeBuy },
          { key: 'rent' as const, label: dict.home.modeRent },
        ]}
        value={mode}
        onChange={setMode}
      />

      <View style={styles.group}>
        <Text style={styles.groupTitle}>{dict.filters.type}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {kindChips(dict).map((k) => (
            <Chip key={k.key} label={k.label} active={filters.kind === k.key} onPress={() => setFilters({ kind: k.key })} />
          ))}
        </ScrollView>
      </View>

      <RangeRow
        bold
        label={dict.filters.maxPrice}
        value={
          filters.maxPrice >= NO_PRICE_LIMIT
            ? dict.filters.noLimit
            : money(filters.maxPrice, locale)
        }
        min={150_000}
        max={NO_PRICE_LIMIT}
        step={25_000}
        current={filters.maxPrice}
        onChange={(v) => setFilters({ maxPrice: v })}
      />

      <View style={styles.group}>
        <Text style={styles.groupTitle}>{dict.filters.bedrooms}</Text>
        <Segmented options={bedroomOptions(dict)} value={filters.bedrooms} onChange={(v) => setFilters({ bedrooms: v })} />
      </View>

      <Pressable onPress={onClose} style={styles.apply}>
        <Text style={styles.applyText}>
          {dict.filters.apply.replace('{count}', countLabel(filtered.length, locale, dict))}
        </Text>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.7, color: c.ink },
  reset: { fontSize: 15, fontWeight: '600', color: c.violet },
  group: { gap: 10 },
  groupTitle: { fontSize: 15, fontWeight: '600', color: c.ink },
  chips: { gap: 8, paddingRight: 8 },
  apply: { backgroundColor: c.violet, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  applyText: { color: c.white, fontSize: 16, fontWeight: '600' },
});
