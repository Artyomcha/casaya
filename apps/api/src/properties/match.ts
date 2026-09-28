import type { PropertyKind } from '@prisma/client';

/** Данные, по которым решается, один это объект или разные. */
export interface MatchCandidate {
  cadastralRef?: string | null;
  address: string;
  city: string;
  lat?: number | null;
  lng?: number | null;
  kind: PropertyKind;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floor?: number | null;
}

/** Порог, выше которого два объявления считаются одним объектом. */
export const MATCH_THRESHOLD = 0.72;

/** Шаг сетки координат для грубого ключа — примерно 110 метров. */
const GRID = 0.001;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9а-яё ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Грубый ключ отбора кандидатов: город, тип и «корзина» площади.
 * Он намеренно широкий — точное решение принимает score().
 */
export function matchKey(c: MatchCandidate): string {
  const areaBucket = Math.round(c.area / 10);
  return [norm(c.city), c.kind, areaBucket, c.bedrooms].join('|');
}

/** Ячейка координатной сетки — чтобы не перебирать весь город. */
export function geoCell(lat?: number | null, lng?: number | null): string | null {
  if (lat == null || lng == null) return null;
  return `${Math.round(lat / GRID)}:${Math.round(lng / GRID)}`;
}

/** Расстояние по большому кругу, метры. */
export function distanceMeters(
  aLat: number, aLng: number, bLat: number, bLng: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Схожесть строк адреса по общим словам (коэффициент Жаккара). */
export function addressSimilarity(a: string, b: string): number {
  const wordsA = new Set(norm(a).split(' ').filter((w) => w.length > 2));
  const wordsB = new Set(norm(b).split(' ').filter((w) => w.length > 2));
  if (!wordsA.size || !wordsB.size) return 0;

  let shared = 0;
  for (const w of wordsA) if (wordsB.has(w)) shared += 1;
  return shared / (wordsA.size + wordsB.size - shared);
}

export interface MatchScore {
  score: number;
  /** Разбор по признакам — его видно в кабинете агентства и в тестах. */
  reasons: Record<string, number>;
  exact: boolean;
}

/**
 * Насколько вероятно, что два описания — один и тот же объект.
 *
 * Кадастровый номер решает всё сам: он официальный и уникальный. Без него
 * складываем признаки с весами — расстояние, площадь, комнаты, адрес, этаж.
 * Жёсткие несовпадения (разный тип, далеко друг от друга, сильно разная
 * площадь) сразу дают ноль: лучше показать два объявления, чем склеить
 * разные квартиры в одну.
 */
export function scoreMatch(a: MatchCandidate, b: MatchCandidate): MatchScore {
  if (a.cadastralRef && b.cadastralRef) {
    const same = a.cadastralRef.trim().toUpperCase() === b.cadastralRef.trim().toUpperCase();
    return { score: same ? 1 : 0, reasons: { cadastral: same ? 1 : 0 }, exact: true };
  }

  if (a.kind !== b.kind) return { score: 0, reasons: { kind: 0 }, exact: false };

  const areaDiff = Math.abs(a.area - b.area) / Math.max(a.area, b.area);
  if (areaDiff > 0.12) return { score: 0, reasons: { area: 0 }, exact: false };

  if (Math.abs(a.bedrooms - b.bedrooms) > 1) {
    return { score: 0, reasons: { bedrooms: 0 }, exact: false };
  }

  // Разные этажи — почти наверняка разные квартиры в одном доме.
  if (a.floor != null && b.floor != null && a.floor !== b.floor) {
    return { score: 0, reasons: { floor: 0 }, exact: false };
  }

  const reasons: Record<string, number> = {};

  const hasGeo = a.lat != null && a.lng != null && b.lat != null && b.lng != null;
  if (hasGeo) {
    const d = distanceMeters(a.lat!, a.lng!, b.lat!, b.lng!);
    if (d > 300) return { score: 0, reasons: { distance: 0 }, exact: false };
    reasons.distance = 1 - d / 300;
  }

  reasons.area = 1 - areaDiff / 0.12;
  reasons.bedrooms = a.bedrooms === b.bedrooms ? 1 : 0.4;
  reasons.bathrooms = a.bathrooms === b.bathrooms ? 1 : 0.5;
  reasons.address = addressSimilarity(a.address, b.address);

  // Координаты — самый надёжный признак, поэтому без них вес перераспределяется.
  const weights = hasGeo
    ? { distance: 0.38, area: 0.24, address: 0.2, bedrooms: 0.12, bathrooms: 0.06 }
    : { distance: 0, area: 0.34, address: 0.38, bedrooms: 0.18, bathrooms: 0.1 };

  const score = Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + weight * (reasons[key] ?? 0),
    0,
  );

  return { score, reasons, exact: false };
}
