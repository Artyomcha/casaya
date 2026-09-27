import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { c, ICON } from '@/theme';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { dot: number; check: number; font: number; padV: number; padR: number }> = {
  sm: { dot: 14, check: 8, font: 11, padV: 4, padR: 8 },
  md: { dot: 15, check: 9, font: 12, padV: 5, padR: 9 },
  lg: { dot: 16, check: 9, font: 12, padV: 6, padR: 10 },
};

/** Бейдж Verificado. На тёмном фоне — белый, на светлом — мятный. */
export function VerifiedBadge({ size = 'md', tinted = false }: { size?: Size; tinted?: boolean }) {
  const s = SIZES[size];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: tinted ? c.greenTint : c.white, paddingVertical: s.padV, paddingRight: s.padR },
      ]}
    >
      <View style={[styles.dot, { width: s.dot, height: s.dot }]}>
        <Icon d={ICON.check} size={s.check} color={c.white} width={4} />
      </View>
      <Text style={[styles.text, { fontSize: s.font }]}>Verificado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  dot: { borderRadius: 999, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' },
  text: { color: c.greenText, fontWeight: '700' },
});
