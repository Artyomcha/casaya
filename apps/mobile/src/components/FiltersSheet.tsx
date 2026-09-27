import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip } from './Chip';
import { RangeRow } from './RangeRow';
import { Segmented } from './Segmented';
import { Sheet } from './Sheet';
import { countLabel, fmt } from '@/format';
import { useApp } from '@/state/AppState';
import { c } from '@/theme';
import { NO_PRICE_LIMIT, type Filters } from '@/types';

export const KIND_CHIPS: { key: Filters['kind']; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'FLAT', label: 'Квартиры' },
  { key: 'HOUSE', label: 'Дома' },
  { key: 'VILLA', label: 'Виллы' },
  { key: 'STUDIO', label: 'Студии' },
];

const BEDROOMS = [
  { key: 0, label: 'Любое' },
  { key: 1, label: '1+' },
  { key: 2, label: '2+' },
  { key: 3, label: '3+' },
  { key: 4, label: '4+' },
];

export function FiltersSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mode, setMode, filters, setFilters, resetFilters, filtered } = useApp();

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Фильтры</Text>
        <Pressable onPress={resetFilters} hitSlop={8}>
          <Text style={styles.reset}>Сбросить</Text>
        </Pressable>
      </View>

      <Segmented
        dark
        options={[
          { key: 'buy' as const, label: 'Купить' },
          { key: 'rent' as const, label: 'Снять' },
        ]}
        value={mode}
        onChange={setMode}
      />

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Тип</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {KIND_CHIPS.map((k) => (
            <Chip key={k.key} label={k.label} active={filters.kind === k.key} onPress={() => setFilters({ kind: k.key })} />
          ))}
        </ScrollView>
      </View>

      <RangeRow
        bold
        label="Цена до"
        value={filters.maxPrice >= NO_PRICE_LIMIT ? 'без ограничений' : fmt(filters.maxPrice)}
        min={150_000}
        max={NO_PRICE_LIMIT}
        step={25_000}
        current={filters.maxPrice}
        onChange={(v) => setFilters({ maxPrice: v })}
      />

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Спальни</Text>
        <Segmented options={BEDROOMS} value={filters.bedrooms} onChange={(v) => setFilters({ bedrooms: v })} />
      </View>

      <Pressable onPress={onClose} style={styles.apply}>
        <Text style={styles.applyText}>Показать {countLabel(filtered.length)}</Text>
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
