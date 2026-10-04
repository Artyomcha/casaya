import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { CasayaMaps3dView } from '../../modules/casaya-maps3d';
import { cameraFor } from './cameraFit';
import type { Pinned, PropertyMapHandle } from './mapTypes';
import { pinLabel } from '@/format';
import { useI18n } from '@/i18n/I18nProvider';
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
  const { locale } = useI18n();
  // Пропорции нужны для охвата выдачи: на узком экране по горизонтали
  // помещается меньше, чем по вертикали.
  const [aspect, setAspect] = useState(1);

  // Камеру считает JS и отдаёт готовой: так формула одна на обе платформы
  // и подбирается перезагрузкой, а не пересборкой.
  useImperativeHandle(ref, () => ({ fit: () => undefined }));

  const camera = useMemo(
    () => JSON.stringify(cameraFor(pins, variant, aspect)),
    [pins, variant, aspect],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (height > 0) setAspect(width / height);
  };

  const payload = useMemo(
    () =>
      JSON.stringify(
        pins.map((p) => ({
          id: p.id,
          label: pinLabel(p.price, mode, locale),
          lat: p.lat,
          lng: p.lng,
        })),
      ),
    [pins, mode, locale],
  );

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <CasayaMaps3dView
        style={styles.map}
        apiKey={GOOGLE_KEY}
        pins={payload}
        camera={camera}
        variant={variant}
        onSelectPin={(event) => onSelect?.(event.nativeEvent.id)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: '#EEF0F4' },
});
