import { Pressable, StyleSheet, Text } from 'react-native';
import { c } from '@/theme';

/** Круглый фильтр-чип. Активный подсвечен сиреневым, как в макете. */
export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? c.violet : c.lineStrong, backgroundColor: active ? c.violetTintSoft : c.white },
      ]}
    >
      <Text style={[styles.label, { color: active ? c.violetDeep : c.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  label: { fontSize: 14, fontWeight: '500' },
});
