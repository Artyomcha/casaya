import { XMLParser } from 'fast-xml-parser';

/**
 * Испанский кадастр (Dirección General del Catastro) отдаёт контуры зданий
 * с числом этажей — бесплатно и без ключа, по ссылке INSPIRE WFS.
 * Этого хватает, чтобы показать в 3D именно тот дом, в котором продаётся
 * квартира, а не абстрактную коробку из OpenStreetMap.
 *
 * Здесь только разбор и геометрия — без сети, чтобы всё покрывалось тестами.
 */

export const CATASTRO_SOURCE = 'Dirección General del Catastro';

/** Этажность кадастр даёт числом, высоту в метрах — нет. Переводим по норме. */
export const FLOOR_HEIGHT_METERS = 3;
/** Первый этаж в испанских домах выше: вход, магазин, портал. */
export const GROUND_FLOOR_HEIGHT_METERS = 3.6;
/** Парапет и машинное помещение лифта — иначе крыша выглядит срезанной. */
export const ROOF_HEIGHT_METERS = 0.9;

export type Ring = [number, number][];

export interface BuildingPart {
  /** Этажей над землёй. */
  floorsAbove: number;
  /** Этажей под землёй — гараж, трастеро. */
  floorsBelow: number;
  /** Расчётная высота в метрах — для fill-extrusion. */
  heightMeters: number;
  /** Кольца в порядке GeoJSON: внешнее первым, вырезы (патио) за ним. */
  rings: Ring[];
}

export interface Footprint {
  cadastralRef: string;
  parts: BuildingPart[];
  /** Этажность самой высокой части — то, что показываем в подписи. */
  floorsAbove: number;
  heightMeters: number;
  /** Центр контура — куда ставить пин и камеру. */
  center: [number, number];
  source: string;
}

/** Высота по числу этажей: первый выше остальных, сверху парапет. */
export function heightFromFloors(floorsAbove: number): number {
  if (floorsAbove <= 0) return 0;
  const upper = (floorsAbove - 1) * FLOOR_HEIGHT_METERS;
  return Math.round((GROUND_FLOOR_HEIGHT_METERS + upper + ROOF_HEIGHT_METERS) * 10) / 10;
}

/**
 * posList в EPSG::4326 идёт в порядке «широта долгота» — так требует
 * ось CRS в версии WFS 2.0. GeoJSON ждёт обратный порядок, поэтому
 * переворачиваем пары здесь, один раз, а не в каждом потребителе.
 */
export function parsePosList(posList: string): Ring {
  const nums = posList.trim().split(/\s+/).map(Number);
  if (nums.length < 6 || nums.length % 2 !== 0 || nums.some(Number.isNaN)) return [];
  const ring: Ring = [];
  for (let i = 0; i < nums.length; i += 2) ring.push([nums[i + 1], nums[i]]);
  return ring;
}

const asArray = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

/** Текст тега: у posList есть атрибуты, поэтому парсер кладёт значение в #text. */
function textOf(node: unknown): string | null {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (node && typeof node === 'object') {
    const text = (node as Record<string, unknown>)['#text'];
    if (typeof text === 'string' || typeof text === 'number') return String(text);
  }
  return null;
}

/** Кольцо внутри exterior/interior лежит на разной глубине у разных выгрузок. */
function ringOf(node: unknown): Ring {
  if (!node || typeof node !== 'object') return [];
  const ring = (node as Record<string, unknown>).LinearRing as Record<string, unknown> | undefined;
  const posList = textOf(ring?.posList) ?? textOf((node as Record<string, unknown>).posList);
  return posList === null ? [] : parsePosList(posList);
}

/** Полигоны лежат то в Surface/patches, то в MultiSurface — ищем рекурсивно. */
function collectPatches(node: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const item of node) collectPatches(item, out);
    return out;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === 'PolygonPatch' || key === 'Polygon') {
      for (const patch of asArray(value)) {
        if (patch && typeof patch === 'object') out.push(patch as Record<string, unknown>);
      }
      continue;
    }
    collectPatches(value, out);
  }
  return out;
}

function ringsOf(part: unknown): Ring[] {
  const rings: Ring[] = [];
  for (const patch of collectPatches(part)) {
    const exterior = ringOf(patch.exterior ?? patch.outerBoundaryIs);
    if (exterior.length < 4) continue;
    rings.push(exterior);
    for (const hole of asArray(patch.interior ?? patch.innerBoundaryIs)) {
      const ring = ringOf(hole);
      if (ring.length >= 4) rings.push(ring);
    }
  }
  return rings;
}

/** Центр по внешним кольцам: средняя точка габаритов, а не центроид полигона. */
export function ringsCenter(parts: BuildingPart[]): [number, number] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const part of parts) {
    for (const [lng, lat] of part.rings[0] ?? []) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  if (minLng === Infinity) return [0, 0];
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: true,
});

const intOf = (value: unknown): number => {
  const n = Number(textOf(value));
  return Number.isFinite(n) ? Math.trunc(n) : 0;
};

/**
 * Разбирает ответ GetBuildingPartByParcel. Пустой контур — нормальный исход:
 * у участка может не быть строений, и 3D тогда просто остаётся без подсветки.
 */
export function parseFootprint(xml: string, cadastralRef: string): Footprint | null {
  if (!xml.includes('BuildingPart')) return null;
  const doc = parser.parse(xml) as Record<string, unknown>;
  const collection = (doc.FeatureCollection ?? doc) as Record<string, unknown>;
  const members = asArray(collection.featureMember as unknown);

  const parts: BuildingPart[] = [];
  for (const member of members) {
    const part = (member as Record<string, unknown>)?.BuildingPart as Record<string, unknown> | undefined;
    if (!part) continue;
    const rings = ringsOf(part);
    if (!rings.length) continue;
    const floorsAbove = intOf(part.numberOfFloorsAboveGround);
    parts.push({
      floorsAbove,
      floorsBelow: intOf(part.numberOfFloorsBelowGround),
      heightMeters: heightFromFloors(floorsAbove),
      rings,
    });
  }
  if (!parts.length) return null;

  const floorsAbove = Math.max(...parts.map((p) => p.floorsAbove));
  return {
    cadastralRef,
    parts,
    floorsAbove,
    heightMeters: heightFromFloors(floorsAbove),
    center: ringsCenter(parts),
    source: CATASTRO_SOURCE,
  };
}

/** Ответ Consulta_RCCOOR / _Distancia: ссылка на участок состоит из двух половин. */
export function parseCadastralRef(xml: string): string | null {
  const pc1 = /<pc1>([^<]+)<\/pc1>/.exec(xml)?.[1]?.trim();
  const pc2 = /<pc2>([^<]+)<\/pc2>/.exec(xml)?.[1]?.trim();
  if (!pc1 || !pc2) return null;
  const ref = `${pc1}${pc2}`;
  return /^[0-9A-Z]{14}$/.test(ref) ? ref : null;
}

/** Адрес из того же ответа — проверяем им, что нашли нужный дом. */
export function parseCadastralAddress(xml: string): string | null {
  return /<ldt>([^<]+)<\/ldt>/.exec(xml)?.[1]?.trim() ?? null;
}

/** Контур в GeoJSON — ровно то, что принимает источник MapLibre. */
export function footprintToGeoJson(footprint: Footprint) {
  return {
    type: 'FeatureCollection' as const,
    features: footprint.parts.map((part, index) => ({
      type: 'Feature' as const,
      id: index,
      properties: {
        height: part.heightMeters,
        floorsAbove: part.floorsAbove,
        floorsBelow: part.floorsBelow,
      },
      geometry: { type: 'Polygon' as const, coordinates: part.rings },
    })),
  };
}
