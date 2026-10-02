'use client';

import { useEffect, useRef, useState } from 'react';
import { money } from '@/i18n/format';
import type { Locale } from '@/i18n/locales';
import { pinLabel } from '@/lib/format';
import type { MapPin, Mode } from '@/lib/types';
import { loadGoogleMaps } from './googleMaps';
import { pinGraphic } from './pinGraphic';
import './map.css';

interface Props {
  pins: MapPin[];
  mode: Mode;
  locale: Locale;
  variant?: 'search' | 'single';
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  favorites?: string[];
  height?: string | number;
  onFail?: () => void;
}

/** Карточка объекта — камера на уровне крыш, чуть сбоку. */
const SINGLE_CAMERA = { range: 420, tilt: 62, heading: 25 };
/** Выдача — вид сверху под небольшим наклоном, чтобы читались берег и горы. */
const SEARCH_CAMERA = { tilt: 35, heading: 0 };
/** Запас вокруг крайних объектов, иначе метки прижимаются к краю кадра. */
const SEARCH_PADDING = 2.3;
const SEARCH_MIN_RANGE = 4_000;

/** Метку поднимаем над землёй и ставим на «ножку», иначе она тонет в домах. */
const PIN_ALTITUDE = 28;

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Расстояние по большому кругу — им считаем, какой охват нужен камере. */
function distanceMeters(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Камера для выдачи: центр габаритов всех объектов и охват по диагонали.
 * Без этого карта вставала на первый объект, а остальные оставались за кадром.
 */
function fitCamera(pins: { lat: number; lng: number }[]) {
  const lats = pins.map((p) => p.lat);
  const lngs = pins.map((p) => p.lng);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const diagonal = distanceMeters([west, south], [east, north]);
  return {
    center: { lat: (south + north) / 2, lng: (west + east) / 2, altitude: 0 },
    range: Math.max(SEARCH_MIN_RANGE, diagonal * SEARCH_PADDING),
    ...SEARCH_CAMERA,
  };
}

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
  favorites = [],
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

    (async () => {
      try {
        const { maps3d } = await loadGoogleMaps();
        if (cancelled) return;

        const camera =
          variant === 'single'
            ? { center: { lat: pins[0].lat, lng: pins[0].lng, altitude: 0 }, ...SINGLE_CAMERA }
            : fitCamera(pins);

        const map = new maps3d.Map3DElement({
          center: camera.center,
          range: camera.range,
          tilt: camera.tilt,
          heading: camera.heading,
          // На карточке объекта — чистая съёмка: вывески кафе и магазинов
          // спорят с нашей меткой, а адрес и так написан над картой.
          // В выдаче подписи нужны: по ним понятно, какой это город.
          mode: variant === 'single'
            ? (maps3d.MapMode?.SATELLITE ?? 'SATELLITE')
            : (maps3d.MapMode?.HYBRID ?? 'HYBRID'),
        });
        map.style.width = '100%';
        map.style.height = '100%';
        container.replaceChildren(map);

        for (const pin of pins) {
          const marker = new maps3d.Marker3DInteractiveElement({
            position: { lat: pin.lat, lng: pin.lng, altitude: PIN_ALTITUDE },
            // RELATIVE_TO_GROUND + extruded — метка висит над домом и соединена
            // с землёй ножкой, иначе на наклонённой съёмке не понять, где она стоит.
            altitudeMode: maps3d.AltitudeMode?.RELATIVE_TO_GROUND ?? 'RELATIVE_TO_GROUND',
            extruded: true,
            // Без label: Google рисует его крупным белым текстом над меткой,
            // а цена и так написана в самой метке.
          });

          // Свою графику Marker3DElement принимает только внутри <template>.
          const template = document.createElement('template');
          template.content.append(
            pinGraphic({
              label: variant === 'single' ? money(pin.price, locale) : pinLabel(pin.price, mode, locale),
              favorite: favorites.includes(pin.id),
            }),
          );
          marker.append(template);
          marker.addEventListener('gmp-click', () => {
            selectRef.current?.(pin.id);
            // В выдаче у метки нет попапа, как на векторной карте, поэтому клик
            // ведёт прямо на объявление — иначе нажатие ничего не даёт.
            if (variant === 'search') window.location.href = `/${locale}/listing/${encodeURIComponent(pin.slug)}`;
          });
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
  }, [pins, mode, locale, variant, favorites]);

  // Подсветка выбранного объекта пока не нужна в 3D: карточка и так открывается кликом.
  void selectedId;

  if (failed) return null;
  return <div ref={host} style={{ width: '100%', height }} />;
}
