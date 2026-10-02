import { Camera, type CameraRef, Layer, Map, Marker } from '@maplibre/maplibre-react-native';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BASEMAP_STYLE, BUILDINGS_3D, CAMERA, COSTA_BLANCA } from './mapStyle';
import { pinLabel } from '@/format';
import { c } from '@/theme';
import type { Listing, Mode } from '@/types';

export type Pinned = Listing & { lat: number; lng: number };

export interface PropertyMapHandle {
  /** Подогнать камеру под все метки: [top, right, bottom, left] в точках. */
  fit: (padding: [number, number, number, number]) => void;
}

interface Props {
  pins: Pinned[];
  mode: Mode;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Одна метка без взаимодействия — блок «На карте» в объявлении. */
  compact?: boolean;
}

export const PropertyMap = forwardRef<PropertyMapHandle, Props>(function PropertyMap(
  { pins, mode, selectedId, onSelect, compact = false },
  ref,
) {
  const camera = useRef<CameraRef>(null);

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
                center: first ? [first.lng, first.lat] : COSTA_BLANCA.center,
                zoom: compact ? CAMERA.single.zoom : COSTA_BLANCA.zoom,
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
                {pinLabel(pin.price, mode)}
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
