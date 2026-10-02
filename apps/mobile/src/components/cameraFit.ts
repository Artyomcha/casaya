/**
 * Камера 3D-карты. Считается здесь, а не в Swift и Kotlin: одна формула на
 * обе платформы, и подбирать её можно перезагрузкой, а не пересборкой.
 */
import type { Pinned } from './mapTypes';

export interface Camera3D {
  lat: number;
  lng: number;
  altitude: number;
  heading: number;
  tilt: number;
  range: number;
  /** ground — высота считается от земли, а не от уровня моря. */
  altitudeMode: 'absolute' | 'ground';
}

/** Карточка объекта — камера на уровне крыш, чуть сбоку. */
const SINGLE = { range: 620, tilt: 46, heading: 25 };
/** Выдача — вид сверху под небольшим наклоном, чтобы читались берег и горы. */
const SEARCH = { tilt: 35, heading: 0 };
const SEARCH_PADDING = 2.2;
const SEARCH_MIN_RANGE = 4_000;

/**
 * Насколько отодвинуть точку обзора от камеры, в долях range.
 *
 * Карта смотрит на center, но при наклоне эта точка оказывается в верхней
 * части кадра, а не в середине. Отодвигаем её по направлению взгляда — объект,
 * который теперь ближе камеры, опускается к центру.
 */
const SINGLE_CENTER_SHIFT = 0.24;

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Расстояние по большому кругу, метры. */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Сдвиг точки на заданное расстояние по азимуту. */
export function offsetPoint(lat: number, lng: number, bearingDeg: number, meters: number) {
  const angular = meters / EARTH_RADIUS_M;
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lng1 = toRad(lng);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: toDeg(lat2), lng: toDeg(lng2) };
}

/** Коста-дель-Соль целиком — когда меток ещё нет. */
const FALLBACK: Camera3D = {
  lat: 36.5,
  lng: -4.95,
  altitude: 0,
  heading: 0,
  tilt: 45,
  range: 120_000,
  altitudeMode: 'absolute',
};

export function cameraFor(
  pins: Pinned[],
  variant: 'search' | 'single',
  aspect: number,
): Camera3D {
  const first = pins[0];
  if (!first) return FALLBACK;

  if (variant === 'single') {
    const centre = offsetPoint(first.lat, first.lng, SINGLE.heading, SINGLE.range * SINGLE_CENTER_SHIFT);
    return {
      ...centre,
      altitude: 0,
      heading: SINGLE.heading,
      tilt: SINGLE.tilt,
      range: SINGLE.range,
      // От земли, а не от уровня моря: в Марбелье рельеф поднят на десятки
      // метров, и точка обзора на нулевой абсолютной высоте уходит под землю.
      altitudeMode: 'ground',
    };
  }

  const lats = pins.map((p) => p.lat);
  const lngs = pins.map((p) => p.lng);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);

  const eastWest = distanceMeters(south, west, south, east);
  const northSouth = distanceMeters(south, west, north, west);
  // На узком экране по горизонтали помещается меньше, чем по вертикали.
  const span = Math.max(northSouth, eastWest / Math.max(aspect, 0.3));

  return {
    lat: (south + north) / 2,
    lng: (west + east) / 2,
    altitude: 0,
    heading: SEARCH.heading,
    tilt: SEARCH.tilt,
    range: Math.max(SEARCH_MIN_RANGE, span * SEARCH_PADDING),
    altitudeMode: 'absolute',
  };
}
