'use client';

import { useEffect, useRef, useState } from 'react';
import { money } from '@/i18n/format';
import type { Locale } from '@/i18n/locales';
import { pinLabel } from '@/lib/format';
import type { MapPin, Mode } from '@/lib/types';
import { loadGoogleMaps } from './googleMaps';
import './map.css';

interface Props {
  pins: MapPin[];
  mode: Mode;
  locale: Locale;
  variant?: 'search' | 'single';
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  height?: string | number;
  onFail?: () => void;
}

/** Высота камеры над землёй: у карточки объекта — уровень крыш, у выдачи — вид на побережье. */
const CAMERA = {
  single: { range: 420, tilt: 62, heading: 25 },
  search: { range: 90_000, tilt: 45, heading: 0 },
} as const;

/** Метку поднимаем над землёй и ставим на «ножку», иначе она тонет в домах. */
const PIN_ALTITUDE = 28;

type Maps3d = {
  Map3DElement: new (options: Record<string, unknown>) => HTMLElement & Record<string, unknown>;
  Marker3DInteractiveElement: new (options: Record<string, unknown>) => HTMLElement & Record<string, unknown>;
  AltitudeMode: Record<string, unknown>;
};

/**
 * Фотореалистичная 3D-карта Google. Пины рисуем своим элементом PinElement
 * в фирменном фиолетовом — стандартная красная капля Google тут не нужна.
 */
export function Google3DMap({
  pins,
  mode,
  locale,
  variant = 'search',
  selectedId,
  onSelect,
  height = '100%',
  onFail,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const failRef = useRef(onFail);
  failRef.current = onFail;

  useEffect(() => {
    if (!host.current || !pins.length) return;
    let cancelled = false;
    const container = host.current;
    const camera = variant === 'single' ? CAMERA.single : CAMERA.search;

    (async () => {
      try {
        await loadGoogleMaps();
        const google = (window as unknown as { google: { maps: { importLibrary: (n: string) => Promise<unknown> } } }).google;
        const maps3d = (await google.maps.importLibrary('maps3d')) as Maps3d;
        const { PinElement } = (await google.maps.importLibrary('marker')) as {
          PinElement: new (o: Record<string, unknown>) => { element: HTMLElement };
        };
        if (cancelled) return;

        const centre = pins[0];
        const map = new maps3d.Map3DElement({
          center: { lat: centre.lat, lng: centre.lng, altitude: 0 },
          range: camera.range,
          tilt: camera.tilt,
          heading: camera.heading,
          mode: 'HYBRID',
        });
        map.style.width = '100%';
        map.style.height = '100%';
        container.replaceChildren(map);

        for (const pin of pins) {
          const glyph = document.createElement('span');
          glyph.textContent = variant === 'single' ? money(pin.price, locale) : pinLabel(pin.price, mode, locale);
          glyph.className = 'casaya-pin-glyph';

          const pinEl = new PinElement({
            background: '#6D3BF5',
            borderColor: '#4B21C6',
            glyphColor: '#FFFFFF',
            glyph,
            scale: 1.25,
          });

          const marker = new maps3d.Marker3DInteractiveElement({
            position: { lat: pin.lat, lng: pin.lng, altitude: PIN_ALTITUDE },
            // RELATIVE_TO_GROUND + extruded — метка висит над домом и соединена с землёй.
            altitudeMode: 'RELATIVE_TO_GROUND',
            extruded: true,
            label: pin.title,
          });
          marker.append(pinEl.element);
          marker.addEventListener('gmp-click', () => selectRef.current?.(pin.id));
          map.append(marker);
        }
      } catch (e) {
        if (cancelled) return;
        console.error('[casaya:map3d]', e);
        setFailed(true);
        failRef.current?.();
      }
    })();

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [pins, mode, locale, variant]);

  // Подсветка выбранного объекта пока не нужна в 3D: карточка и так открывается кликом.
  void selectedId;

  if (failed) return null;
  return <div ref={host} style={{ width: '100%', height }} />;
}
