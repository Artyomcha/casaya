import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ListingRow } from '@/components/ListingCards';
import { LoadState, Screen } from '@/components/Screen';
import { useI18n } from '@/i18n/I18nProvider';
import { useApp } from '@/state/AppState';
import { c, ICON } from '@/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const { listings, favorites, mode, loading, error, reload } = useApp();
  const { dict } = useI18n();

  const saved = useMemo(() => listings.filter((l) => favorites.includes(l.id)), [listings, favorites]);

  return (
    <Screen contentStyle={styles.content}>
      <Text style={styles.title}>{dict.favorites.title}</Text>

      <LoadState loading={loading} error={error} onRetry={reload} />

      {!loading && !error && saved.length === 0 && (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Svg width={26} height={26} viewBox="0 0 24 24">
              <Path d={ICON.heart} fill="none" stroke={c.coral} strokeWidth={1.9} strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={styles.emptyTitle}>{dict.favorites.emptyTitle}</Text>
          <Text style={styles.emptyText}>{dict.favorites.emptyText}</Text>
          <Pressable onPress={() => router.push('/results')} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>{dict.favorites.emptyCta}</Text>
          </Pressable>
        </View>
      )}

      {saved.map((item) => (
        <ListingRow key={item.id} item={item} mode={mode} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 18 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -1.2, color: c.ink },
  empty: {
    backgroundColor: c.surface,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: c.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: c.ink },
  emptyText: { fontSize: 14, color: c.muted, textAlign: 'center', lineHeight: 21 },
  emptyBtn: { marginTop: 4, backgroundColor: c.violet, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20 },
  emptyBtnText: { color: c.white, fontSize: 15, fontWeight: '600' },
});
