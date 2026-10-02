import { StyleSheet, Text, View } from 'react-native';
import { discountLabel } from '@/format';
import { c } from '@/theme';
import type { Savings } from '@/types';

/**
 * «−11%» — главное обещание портала. Зелёный, а не фиолетовый: фиолетовый
 * у нас значит «выбрано», и выгоду с ним путать нельзя.
 */
export function SavingsBadge({ savings, size = 'sm' }: { savings: Savings; size?: 'sm' | 'md' }) {
  const big = size === 'md';
  return (
    <View style={[styles.badge, big && styles.badgeBig]}>
      <Text style={[styles.text, big && styles.textBig]}>{discountLabel(savings)}</Text>
    </View>
  );
}

/** Цена рядом с зачёркнутой рыночной — разницу видно без расчётов. */
export function PriceWithMarket({
  price,
  marketPrice,
  priceStyle,
}: {
  price: string;
  marketPrice: string | null;
  priceStyle?: object;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={priceStyle}>{price}</Text>
      {marketPrice && <Text style={styles.market}>{marketPrice}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: c.greenTint,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
    alignSelf: 'flex-start',
  },
  badgeBig: { paddingVertical: 6, paddingHorizontal: 12 },
  text: { fontSize: 12, fontWeight: '700', color: c.greenText },
  textBig: { fontSize: 14 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  market: { fontSize: 14, color: c.grey, textDecorationLine: 'line-through' },
});
