import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CasayaMaps3dView } from '../../modules/casaya-maps3d';
import type { Pinned, PropertyMapHandle } from './mapTypes';
import { pinLabel } from '@/format';
import type { Mode } from '@/types';

/**
 * Фотореалистичная 3D-карта Google, нативно: Maps 3D SDK для iOS и Android
 * через собственный модуль modules/casaya-maps3d. Метки там свои — та же
 * белая таблетка с ценой, что на портале, а не стандартная капля Google.
 */
export const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

interface Props {
  pins: Pinned[];
  mode: Mode;
  onSelect?: (id: string) => void;
  /** Одна метка без взаимодействия — блок «На карте» в объявлении. */
  compact?: boolean;
  /** Карта не загрузилась — экран возвращается на векторную подложку. */
  onFail?: () => void;
}

export const Google3DMap = forwardRef<PropertyMapHandle, Props>(function Google3DMap(
  { pins, mode, onSelect, compact = false },
  ref,
) {
  const [variant] = useState<'search' | 'single'>(compact ? 'single' : 'search');

  // Камеру под набор меток считает нативная сторона — там же, где рисуется
  // карта, иначе пришлось бы гонять границы туда-обратно на каждый кадр.
  useImperativeHandle(ref, () => ({ fit: () => undefined }));

  const payload = useMemo(
    () =>
      JSON.stringify(
        pins.map((p) => ({
          id: p.id,
          label: pinLabel(p.price, mode),
          lat: p.lat,
          lng: p.lng,
        })),
      ),
    [pins, mode],
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <CasayaMaps3dView
        style={styles.map}
        apiKey={GOOGLE_KEY}
        pins={payload}
        variant={variant}
        onSelectPin={(event) => onSelect?.(event.nativeEvent.id)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: '#EEF0F4' },
});
