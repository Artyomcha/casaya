import { PromotionTier } from '@prisma/client';
import { distanceMeters } from '../properties/match';

/** Что алгоритм знает об объявлении. */
export interface Rankable {
  id: string;
  price: number;
  area: number;
  bedrooms: number;
  kind: string;
  seaView: boolean;
  verified: boolean;
  videoTour: boolean;
  publishedAt: Date;
  photos: number;
  descriptionLength: number;
  lat?: number | null;
  lng?: number | null;
  /// Район — по нему продаётся «Top района».
  area_name?: string | null;
  agencyReplyTime: number;
  promotionTier: PromotionTier;
}

export interface RankContext {
  /** Медианная цена м² по выборке — считается один раз на запрос. */
  medianPricePerM2: number;
  now: Date;
  /** Район, по которому идёт поиск: только здесь работает Top района. */
  area?: string | null;
}

/**
 * Вклад платного продвижения.
 *
 * Потолок намеренно низкий: продвижение двигает объявление среди сопоставимых,
 * но не вытаскивает наверх мусор. Если купленный буст перевешивает качество,
 * выдача протухает, а вместе с ней и весь трафик — то самое, чем болеет
 * лидер рынка.
 */
export const PROMOTION_BOOST: Record<PromotionTier, number> = {
  NONE: 0,
  BUMP: 0.06,
  FEATURED: 0.14,
  TOP_AREA: 0.22,
};

/** Веса признаков. В сумме — единица, чтобы score читался как доля. */
export const WEIGHTS = {
  verified: 0.26,
  freshness: 0.2,
  completeness: 0.18,
  priceValue: 0.22,
  responsiveness: 0.14,
} as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Свежесть с периодом полураспада в две недели. */
export function freshnessScore(publishedAt: Date, now: Date): number {
  const days = (now.getTime() - publishedAt.getTime()) / 86_400_000;
  return clamp01(Math.pow(0.5, Math.max(0, days) / 14));
}

/**
 * Полнота карточки: фотографии, описание, видео-тур.
 * Прямо влияет на конверсию, поэтому и на место в выдаче.
 */
export function completenessScore(r: Rankable): number {
  const photos = clamp01(r.photos / 8);
  const text = clamp01(r.descriptionLength / 600);
  const video = r.videoTour ? 1 : 0;
  return 0.45 * photos + 0.35 * text + 0.2 * video;
}

/**
 * Насколько объект выгоден по цене за м² относительно медианы выборки.
 *
 * Шкала симметрична вокруг медианы: на четверть дешевле — максимум,
 * ровно по медиане — середина, на четверть дороже — ноль. Дорогое жильё
 * не проваливается совсем: оно тоже кому-то нужно, просто ищется иначе.
 */
export function priceValueScore(r: Rankable, medianPricePerM2: number): number {
  if (!medianPricePerM2 || !r.area) return 0.5;
  const ratio = r.price / r.area / medianPricePerM2;
  return clamp01(1 - (ratio - 0.75) / 0.5);
}

/** Скорость ответа агентства: 10 минут — отлично, час и дольше — плохо. */
export function responsivenessScore(replyMinutes: number): number {
  return clamp01(1 - (replyMinutes - 10) / 50);
}

export interface RankResult {
  id: string;
  score: number;
  /** Разбор по слагаемым — его отдаёт debug-режим и показывает кабинет. */
  breakdown: Record<string, number>;
}

/**
 * Итоговый вес объявления в выдаче.
 *
 * Качество считается всегда одинаково, продвижение добавляется сверху
 * ограниченной добавкой. Top района действует только внутри своего района:
 * купить топ по Марбелье и всплыть в Эстепоне нельзя.
 */
export function scoreListing(r: Rankable, ctx: RankContext): RankResult {
  const parts = {
    verified: r.verified ? 1 : 0,
    freshness: freshnessScore(r.publishedAt, ctx.now),
    completeness: completenessScore(r),
    priceValue: priceValueScore(r, ctx.medianPricePerM2),
    responsiveness: responsivenessScore(r.agencyReplyTime),
  };

  const quality = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce(
    (sum, key) => sum + WEIGHTS[key] * parts[key],
    0,
  );

  const tierApplies =
    r.promotionTier !== 'TOP_AREA' || !ctx.area || r.area_name === ctx.area;
  const promotion = tierApplies ? PROMOTION_BOOST[r.promotionTier] : 0;

  return {
    id: r.id,
    score: quality + promotion,
    breakdown: { ...parts, quality, promotion },
  };
}

/** Медиана цены за м² по выборке — база для priceValue. */
export function medianPricePerM2(items: { price: number; area: number }[]): number {
  const values = items.filter((i) => i.area > 0).map((i) => i.price / i.area).sort((a, b) => a - b);
  if (!values.length) return 0;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

/**
 * Предел «рядом», метры.
 *
 * Для Коста-дель-Соль три километра слишком мало: соседние городки вдоль
 * побережья стоят в 5–10 км друг от друга, и объект в Альтее — вполне
 * уместная альтернатива объекту в Эстепоне. Двенадцать километров
 * покрывают свой городок и ближайшие, но не всю провинцию.
 */
export const NEARBY_RADIUS_METERS = 12_000;

/**
 * Похожесть двух объектов — основа рекомендаций «рядом».
 * Расстояние важнее всего: человек ищет в конкретном месте.
 */
export function similarityScore(
  base: Rankable,
  other: Rankable,
): { score: number; distance: number | null } {
  if (base.id === other.id) return { score: 0, distance: 0 };

  let distance: number | null = null;
  let geo = 0.5;

  if (base.lat != null && base.lng != null && other.lat != null && other.lng != null) {
    distance = distanceMeters(base.lat, base.lng, other.lat, other.lng);
    geo = clamp01(1 - distance / NEARBY_RADIUS_METERS);
    if (geo === 0) return { score: 0, distance };
  }

  const priceRatio = Math.abs(base.price - other.price) / Math.max(base.price, other.price);
  const price = clamp01(1 - priceRatio / 0.5);

  const areaRatio = Math.abs(base.area - other.area) / Math.max(base.area, other.area);
  const area = clamp01(1 - areaRatio / 0.5);

  const rooms = clamp01(1 - Math.abs(base.bedrooms - other.bedrooms) / 3);
  const kind = base.kind === other.kind ? 1 : 0.4;
  const sea = base.seaView === other.seaView ? 1 : 0.6;

  const score =
    0.38 * geo + 0.22 * price + 0.16 * area + 0.12 * rooms + 0.07 * kind + 0.05 * sea;

  return { score, distance };
}
