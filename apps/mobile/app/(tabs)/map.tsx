import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FiltersSheet } from '@/components/FiltersSheet';
import { Icon } from '@/components/Icon';
import { PropertyMap, type Pinned, type PropertyMapHandle } from '@/components/PropertyMap';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { imageUrl } from '@/api';
import { countLabel, perM2Label, priceLabel, specsOf } from '@/format';
import { useApp } from '@/state/AppState';
import { c, ICON, TAB_BAR_SPACE } from '@/theme';
import type { Listing } from '@/types';

/** Объекты без координат на карту не попадают. */
const hasCoords = (l: Listing): l is Pinned => l.lat != null && l.lng != null;

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const map = useRef<PropertyMapHandle>(null);
  const { filtered, mode } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const pins = useMemo(() => filtered.filter(hasCoords), [filtered]);
  const selected = pins.find((p) => p.id === selectedId) ?? pins[0];

  // Подгоняем границы под текущую выдачу: сменился фильтр — сменился и вид.
  useEffect(() => {
    if (!pins.length) return;
    setSelectedId((id) => (pins.some((p) => p.id === id) ? id : pins[0].id));
    const timer = setTimeout(
      () => map.current?.fit([insets.top + 150, 40, TAB_BAR_SPACE + 170, 40]),
      450,
    );
    return () => clearTimeout(timer);
  }, [pins, insets.top]);

  return (
    <View style={styles.root}>
      <PropertyMap
        ref={map}
        pins={pins}
        mode={mode}
        selectedId={selected?.id ?? null}
        onSelect={setSelectedId}
      />

      <View style={[styles.topBar, { top: insets.top + 6 }]}>
        <Pressable onPress={() => router.push('/results')} style={styles.searchBar}>
          <Icon d={ICON.search} size={18} color={c.muted} width={2} />
          <Text style={styles.searchText}>Аликанте · {mode === 'rent' ? 'снять' : 'купить'}</Text>
        </Pressable>
        <Pressable onPress={() => setFiltersOpen(true)} style={styles.filterBtn}>
          <Icon d={ICON.sliders} size={20} width={2} />
        </Pressable>
      </View>

      <View style={[styles.counter, { top: insets.top + 68 }]}>
        <Text style={styles.counterText}>{countLabel(pins.length)}</Text>
      </View>

      {selected && (
        <Pressable
          onPress={() => router.push(`/listing/${selected.slug}`)}
          style={[styles.card, { bottom: TAB_BAR_SPACE - 8 }]}
        >
          <Image source={{ uri: imageUrl(selected.coverImage) }} style={styles.cardImage} />
          <View style={styles.cardBody}>
            {selected.verified && <VerifiedBadge size="sm" tinted />}
            <Text style={styles.cardPrice}>{priceLabel(selected.price, mode)}</Text>
            <Text style={styles.cardSpecs}>{specsOf(selected)}</Text>
            <Text style={styles.cardAddress}>
              {selected.address} · {perM2Label(selected, mode)}
            </Text>
          </View>
        </Pressable>
      )}

      <FiltersSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF0F4' },

  topBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', gap: 10 },
  searchBar: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: c.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    shadowColor: c.ink,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  searchText: { fontSize: 15, color: c.ink },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: c.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.ink,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  counter: {
    position: 'absolute',
    left: 16,
    backgroundColor: c.ink,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  counterText: { color: c.white, fontSize: 13, fontWeight: '600' },

  pin: {
    backgroundColor: c.white,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    shadowColor: c.ink,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  pinActive: { backgroundColor: c.violet },
  pinText: { fontSize: 13, fontWeight: '700', color: c.ink },
  pinTextActive: { color: c.white },

  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: c.white,
    borderRadius: 24,
    padding: 10,
    shadowColor: c.ink,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  cardImage: { width: 112, height: 112, borderRadius: 16 },
  cardBody: { flex: 1, paddingVertical: 4, gap: 3 },
  cardPrice: { fontSize: 19, fontWeight: '700', letterSpacing: -0.4, color: c.ink, marginTop: 4 },
  cardSpecs: { fontSize: 13, color: c.inkSoft },
  cardAddress: { fontSize: 13, color: c.grey },
});
