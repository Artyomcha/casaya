import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
import { c } from '@/theme';

/** Строка «подпись — значение» со слайдером под ней. */
export function RangeRow({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
  bold = false,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (v: number) => void;
  bold?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.label, bold && styles.labelBold]}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={current}
        onValueChange={onChange}
        minimumTrackTintColor={c.violet}
        maximumTrackTintColor={c.lineStrong}
        thumbTintColor={c.violet}
        style={styles.slider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: 14, color: c.muted },
  labelBold: { fontSize: 15, fontWeight: '600', color: c.ink },
  value: { fontSize: 15, fontWeight: '600', color: c.ink },
  // На iOS слайдер по умолчанию ниже — выравниваем высоту между платформами.
  slider: { width: '100%', height: 32, marginHorizontal: -4 },
});
