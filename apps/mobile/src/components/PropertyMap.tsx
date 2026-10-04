import { Camera, type CameraRef, Layer, Map, Marker } from '@maplibre/maplibre-react-native';
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GOOGLE_KEY, Google3DMap } from './Google3DMap';
import { BASEMAP_STYLE, BUILDINGS_3D, CAMERA, COSTA_DEL_SOL } from './mapStyle';
import type { Pinned, PropertyMapHandle } from './mapTypes';
import { pinLabel } from '@/format';
import { useI18n } from '@/i18n/I18nProvider';
import { c } from '@/theme';
import type { Mode } from '@/types';

interface Props {
  pins: Pinned[];
  mode: Mode;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Одна метка без взаимодействия — блок «На карте» в объявлении. */
  compact?: boolean;
}

export type { Pinned, PropertyMapHandle } from './mapTypes';

/**
 * Карта объектов. По умолчанию — фотореалистичный 3D Google через нативный
 * Maps 3D SDK. Без ключа (или если карта не поднялась) экран молча переходит
 * на бесплатную векторную подложку с теми же объёмными домами и теми же
 * метками: без карты приложение выглядит сломанным.
 */
export const PropertyMap = forwardRef<PropertyMapHandle, Props>(function PropertyMap(
  props,
  ref,
) {
  const [googleFailed, setGoogleFailed] = useState(false);

  if (GOOGLE_KEY && !googleFailed && props.pins.length) {
    return (
      <Google3DMap
        ref={ref}
        pins={props.pins}
        mode={props.mode}
        onSelect={props.onSelect}
        compact={props.compact}
        onFail={() => setGoogleFailed(true)}
      />
    );
  }
  return <VectorMap ref={ref} {...props} />;
});

const VectorMap = forwardRef<PropertyMapHandle, Props>(function VectorMap(
  { pins, mode, selectedId, onSelect, compact = false },
  ref,
) {
  const camera = useRef<CameraRef>(null);
  const { locale } = useI18n();

  // Границы в порядке GeoJSON: запад, юг, восток, север.
  const bounds = useMemo(() => {
    if (pins.length < 2) return null;
    const lngs = pins.map((p) => p.lng);
    const lats = pins.map((p) => p.lat);
    return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)] as [
      number,
      number,
      number,
      number,
    ];
  }, [pins]);

  useImperativeHandle(ref, () => ({
    fit: ([top, right, bottom, left]) => {
      if (!bounds) return;
      camera.current?.fitBounds(bounds, {
        padding: { top, right, bottom, left },
        duration: 600,
      });
    },
  }));

  const first = pins[0];

  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={BASEMAP_STYLE}
      logo={false}
      attribution={!compact}
      compass={false}
      scaleBar={false}
      dragPan={!compact}
      touchZoom={!compact}
      doubleTapZoom={!compact}
      touchRotate={!compact}
      touchPitch={!compact}
    >
      {/* Объём добавляется поверх готового стиля: в нём уже есть источник
          openmaptiles с высотами домов, своего грузить не надо. */}
      <Layer {...BUILDINGS_3D} />

      <Camera
        ref={camera}
        initialViewState={
          bounds && !compact
            ? {
                bounds,
                padding: { top: 150, right: 40, bottom: 250, left: 40 },
                pitch: CAMERA.search.pitch,
                bearing: CAMERA.search.bearing,
              }
            : {
                center: first ? [first.lng, first.lat] : COSTA_DEL_SOL.center,
                zoom: compact ? CAMERA.single.zoom : COSTA_DEL_SOL.zoom,
                pitch: compact ? CAMERA.single.pitch : CAMERA.search.pitch,
                bearing: compact ? CAMERA.single.bearing : CAMERA.search.bearing,
              }
        }
      />

      {pins.map((pin) => {
        const active = compact || pin.id === selectedId;
        return (
          <Marker
            key={pin.id}
            id={pin.id}
            lngLat={[pin.lng, pin.lat]}
            anchor="bottom"
            onPress={() => onSelect?.(pin.id)}
          >
            <View style={[styles.pin, active && styles.pinActive]}>
              <Text style={[styles.pinText, active && styles.pinTextActive]}>
                {pinLabel(pin.price, mode, locale)}
              </Text>
              <View style={[styles.tail, active && styles.tailActive]} />
            </View>
          </Marker>
        );
      })}
    </Map>
  );
});

const styles = StyleSheet.create({
  pin: {
    backgroundColor: c.white,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: c.ink,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  pinActive: { backgroundColor: c.violet },
  pinText: { fontSize: 13, fontWeight: '700', color: c.ink },
  pinTextActive: { color: c.white },
  // Треугольный «хвостик» под таблеткой, как в макете.
  tail: {
    position: 'absolute',
    bottom: -4,
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: c.white,
    transform: [{ rotate: '45deg' }],
  },
  tailActive: { backgroundColor: c.violet },
});
