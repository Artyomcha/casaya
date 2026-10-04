import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, imageUrl } from '@/api';
import { money } from '@/format';
import { useI18n } from '@/i18n/I18nProvider';
import { useSession } from '@/state/SessionState';
import type { OwnerDashboard } from '@/types';
import { c } from '@/theme';

/**
 * Кабинет продавца: его объекты с показами и откликами.
 *
 * Показывается только тому, кто при регистрации выбрал «Продаю»: покупателю
 * этот блок не нужен, а роль как раз и заводится ради этого различия.
 */
export function SellerListings() {
  const router = useRouter();
  const { locale, dict } = useI18n();
  const { user } = useSession();
  const [data, setData] = useState<OwnerDashboard | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'SELLER') return;
    api
      .ownerDashboard(user.id)
      .then(setData)
      .catch(() => setData({ listings: [], leads: [] }));
  }, [user]);

  if (!user || user.role !== 'SELLER' || !data) return null;

  return (
    <View style={styles.block}>
      <Text style={styles.title}>{dict.auth.sellerTitle}</Text>

      {data.listings.length === 0 && <Text style={styles.empty}>{dict.auth.sellerEmpty}</Text>}

      {data.listings.map((l) => (
        <Pressable key={l.id} onPress={() => router.push(`/listing/${l.slug}`)} style={styles.row}>
          <Image source={{ uri: imageUrl(l.coverImage) }} style={styles.cover} />
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>
              {l.title}
            </Text>
            <Text style={styles.price}>{money(l.price, locale)}</Text>
            <Text style={styles.stats}>
              {dict.auth.sellerViews}: {l.impressions} · {dict.auth.sellerLeads}: {l._count.leads}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10 },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.6, color: c.ink },
  empty: { fontSize: 15, color: c.grey },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: c.white,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: c.line,
  },
  cover: { width: 72, height: 72, borderRadius: 12, backgroundColor: c.surfaceAlt },
  body: { flex: 1, justifyContent: 'center', gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: c.ink },
  price: { fontSize: 16, fontWeight: '700', color: c.ink },
  stats: { fontSize: 13, color: c.grey },
});
