import { Pressable, StyleSheet, Text, View } from 'react-native';
import { c } from '@/theme';

export interface Option<T> {
  key: T;
  label: string;
}

/** Переключатель на подложке #F5F3F9 — режим, срок, спальни. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  dark = false,
}: {
  options: Option<T>[];
  value: T;
  onChange: (key: T) => void;
  /** Тёмный вариант: активный сегмент чёрный (переключатель Купить / Снять). */
  dark?: boolean;
}) {
  return (
    <View style={styles.track}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={String(o.key)}
            onPress={() => onChange(o.key)}
            style={[
              styles.item,
              active && (dark ? styles.itemActiveDark : styles.itemActive),
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? (dark ? c.white : c.ink) : dark ? c.muted : c.grey },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: c.surfaceAlt,
    borderRadius: 14,
    padding: 4,
  },
  item: { flex: 1, borderRadius: 11, paddingVertical: 11, alignItems: 'center' },
  itemActive: {
    backgroundColor: c.white,
    shadowColor: c.ink,
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  itemActiveDark: { backgroundColor: c.ink },
  label: { fontSize: 15, fontWeight: '600' },
});
